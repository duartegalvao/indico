# This file is part of Indico.
# Copyright (C) 2002 - 2025 CERN
#
# Indico is free software; you can redistribute it and/or
# modify it under the terms of the MIT License; see the
# LICENSE file for more details.

from datetime import datetime, timedelta

from flask import request
from pytz import utc
from wtforms.fields import BooleanField, HiddenField, StringField, TextAreaField
from wtforms.validators import DataRequired, InputRequired, ValidationError

from indico.modules.events.contributions import contribution_settings
from indico.modules.events.contributions.forms import ContributionForm
from indico.modules.events.sessions.forms import SessionBlockForm
from indico.modules.events.timetable.models.entries import TimetableEntryType
from indico.modules.events.timetable.util import find_next_start_dt
from indico.util.i18n import _
from indico.util.spreadsheets import CSVFieldDelimiter
from indico.web.forms.base import FormDefaults, IndicoForm, generated_data
from indico.web.forms.colors import get_colors
from indico.web.forms.fields import (FileField, IndicoEnumSelectField, IndicoLocationField, IndicoPalettePickerField,
                                     IndicoSelectMultipleCheckboxBooleanField, IndicoTimeField)
from indico.web.forms.fields.datetime import IndicoDurationField
from indico.web.forms.validators import MaxDuration
from indico.web.forms.widgets import SwitchWidget


class EntryFormMixin:
    _entry_type = None
    _default_duration = None
    _display_fields = None

    time = IndicoTimeField(_('Start time'), [InputRequired()])
    duration = IndicoDurationField(_('Duration'), [DataRequired(), MaxDuration(timedelta(hours=24))],
                                   default=timedelta(minutes=20))

    def __init__(self, *args, **kwargs):
        self.event = kwargs['event']
        self.session_block = kwargs.get('session_block')
        self.day = kwargs.pop('day')
        if self._default_duration is not None:
            kwargs.setdefault('time', self._get_default_time())
            defaults = kwargs.get('obj') or FormDefaults()
            if 'duration' not in defaults:
                if self._entry_type == TimetableEntryType.CONTRIBUTION and self.session_block:
                    defaults.duration = self.session_block.session.default_contribution_duration
                else:
                    defaults.duration = self._default_duration
                kwargs['obj'] = defaults
        super().__init__(*args, **kwargs)

    @property
    def data(self):
        data = super().data
        del data['time']
        return data

    @generated_data
    def start_dt(self):
        if self.time.data is not None:
            dt = datetime.combine(self.day, self.time.data)
            return self.event.tzinfo.localize(dt).astimezone(utc)

    def validate_duration(self, field):
        if not self.start_dt.data:
            return
        end_dt = self.start_dt.data + field.data
        if end_dt.astimezone(self.event.tzinfo).date() > self.event.end_dt_local.date():
            raise ValidationError(_('{} exceeds current day. Adjust start time or duration.')
                                  .format(self._entry_type.title.capitalize()))

    def _get_default_time(self):
        if self.session_block:
            # inside a block we suggest right after the latest contribution
            # or fall back to the block start time if it's empty
            entry = self.session_block.timetable_entry
            start_dt = max(x.end_dt for x in entry.children) if entry.children else entry.start_dt
        else:
            # outside a block we find the first slot where a contribution would fit
            start_dt = find_next_start_dt(self._default_duration,
                                          obj=self.session_block or self.event,
                                          day=None if self.session_block else self.day)
        return start_dt.astimezone(self.event.tzinfo).time() if start_dt else None


class BreakEntryForm(EntryFormMixin, IndicoForm):
    _entry_type = TimetableEntryType.BREAK
    _default_duration = timedelta(minutes=20)
    _display_fields = ('title', 'description', 'time', 'duration', 'location_data', 'colors')

    title = StringField(_('Title'), [DataRequired()])
    description = TextAreaField(_('Description'))
    location_data = IndicoLocationField(_('Location'))
    colors = IndicoPalettePickerField(_('Colors'), color_list=get_colors())


class ContributionEntryForm(EntryFormMixin, ContributionForm):
    _entry_type = TimetableEntryType.CONTRIBUTION
    _display_fields = ('title', 'description', 'type', 'time', 'duration', 'person_link_data', 'location_data',
                       'keywords', 'references')

    def __init__(self, *args, **kwargs):
        kwargs['to_schedule'] = kwargs.get('to_schedule', True)
        super().__init__(*args, **kwargs)

    @property
    def _default_duration(self):
        return contribution_settings.get(self.event, 'default_duration')


class SessionBlockEntryForm(EntryFormMixin, SessionBlockForm):
    _entry_type = TimetableEntryType.SESSION_BLOCK
    _default_duration = timedelta(minutes=60)
    _display_fields = ('title', 'time', 'duration', 'person_links', 'location_data', 'code')

    @staticmethod
    def _validate_duration(entry, field, start_dt):
        if entry.children and start_dt.data is not None:
            end_dt = start_dt.data + field.data
            if end_dt < max(x.end_dt for x in entry.children):
                raise ValidationError(_('This duration is too short to fit the entries within.'))

    def validate_duration(self, field):
        super().validate_duration(field)
        if self.session_block and self.start_dt.data:
            self._validate_duration(self.session_block.timetable_entry, field, self.start_dt)


class BaseEntryForm(EntryFormMixin, IndicoForm):
    shift_later = BooleanField(_('Shift'), widget=SwitchWidget(),
                               description=_('Shift all entries after this one up or down'))

    def __init__(self, *args, **kwargs):
        self.entry = kwargs.pop('entry')
        self._entry_type = self.entry.type
        super().__init__(*args, **kwargs)

    def validate_duration(self, field):
        super().validate_duration(field)
        if self.entry.type == TimetableEntryType.SESSION_BLOCK and self.entry.children:
            SessionBlockEntryForm._validate_duration(self.entry, field, self.start_dt)


_DOCUMENT_SETTINGS_CHOICES = [('showCoverPage', _('Include cover page')),
                              ('showTableContents', _('Include table of contents')),
                              ('showSessionTOC', _('Show list of sessions in the table of contents'))]
_CONTRIBUTION_CHOICES = [('showAbstract', _('Print abstract content of all contributions')),
                         ('dontShowPosterAbstract', _('Do not print the abstract content for poster sessions')),
                         ('showLengthContribs', _('Include length of the contributions'))]
_SESSION_CHOICES = [('newPagePerSession', _('Print each session on a separate page')),
                    ('showSessionDescription', _('Include session description')),
                    ('printDateCloseToSessions', _('Print the start date close to session title'))]
_VISIBLE_ENTRIES_CHOICES = [('showContribsAtConfLevel', _('Include top-level contributions')),
                            ('showBreaksAtConfLevel', _('Include top-level breaks'))]
_OTHER_CHOICES = [('showSpeakerTitle', _('Show speaker title')),
                  ('showSpeakerAffiliation', _('Show speaker affiliation'))]


class TimetablePDFExportForm(IndicoForm):
    document_settings = IndicoSelectMultipleCheckboxBooleanField(_('Document settings'),
                                                                 choices=_DOCUMENT_SETTINGS_CHOICES)
    contribution_info = IndicoSelectMultipleCheckboxBooleanField(_('Contributions'),
                                                                 choices=_CONTRIBUTION_CHOICES)
    session_info = IndicoSelectMultipleCheckboxBooleanField(_('Sessions'),
                                                            choices=_SESSION_CHOICES)
    visible_entries = IndicoSelectMultipleCheckboxBooleanField(_('Top-level items'),
                                                               choices=_VISIBLE_ENTRIES_CHOICES)
    other = IndicoSelectMultipleCheckboxBooleanField(_('Miscellaneous'), choices=_OTHER_CHOICES)
    submitted = HiddenField()

    def is_submitted(self):
        return 'submitted' in request.args


class ImportContributionsForm(IndicoForm):
    source_file = FileField(_('Source File'), [DataRequired(_('You need to upload a CSV file.'))],
                            accepted_file_types='.csv')
    delimiter = IndicoEnumSelectField(_('CSV field delimiter'), enum=CSVFieldDelimiter, default=CSVFieldDelimiter.comma)
