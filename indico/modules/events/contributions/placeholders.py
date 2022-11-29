# This file is part of Indico.
# Copyright (C) 2002 - 2022 CERN
#
# Indico is free software; you can redistribute it and/or
# modify it under the terms of the MIT License; see the
# LICENSE file for more details.

from indico.modules.events.abstracts.models.abstracts import AbstractState
from indico.util.i18n import _, orig_string
from indico.util.placeholders import Placeholder
from indico.web.flask.util import url_for


__all__ = ('EventTitlePlaceholder', 'EventURLPlaceholder', 'ContributionIDPlaceholder', 'AbstractTitlePlaceholder',
           'AbstractInvitationURLPlaceholder', 'AbstractTrackPlaceholder',
           'AbstractSessionPlaceholder', 'PrimaryAuthorsPlaceholder', 'CoAuthorsPlaceholder',
           'SubmitterNamePlaceholder', 'SubmitterFirstNamePlaceholder', 'SubmitterLastNamePlaceholder',
           'SubmitterTitlePlaceholder', 'JudgmentCommentPlaceholder', 'ContributionTypePlaceholder',
           'ContributionURLPlaceholder')


class EventTitlePlaceholder(Placeholder):
    name = 'event_title'
    description = _('The title of the event')

    @classmethod
    def render(cls, contribution):
        return contribution.event.title


class EventURLPlaceholder(Placeholder):
    name = 'event_url'
    description = _('The URL of the event')

    @classmethod
    def render(cls, contribution):
        return contribution.event.external_url


class ContributionIDPlaceholder(Placeholder):
    name = 'contribution_id'
    description = _('The ID of the contribution')

    @classmethod
    def render(cls, contribution):
        return str(contribution.friendly_id)


class AbstractTitlePlaceholder(Placeholder):
    name = 'contribution_title'
    description = _('The title of the contribution')

    @classmethod
    def render(cls, contribution):
        return contribution.title


class AbstractInvitationURLPlaceholder(Placeholder):
    name = 'invitation_url'
    description = _('The link to submit an invited contribution')

    @classmethod
    def render(cls, contribution):
        return url_for('contributions.submit_invited_contribution', contribution.locator.token, _external=True)


class AbstractTrackPlaceholder(Placeholder):
    name = 'contribution_track'
    description = _('The name of the destination track')

    @classmethod
    def render(cls, abstract):
        if abstract.state == AbstractState.accepted:
            return abstract.accepted_track.title if abstract.accepted_track else ''
        return ', '.join(t.title for t in abstract.submitted_for_tracks)


class AbstractSessionPlaceholder(Placeholder):
    name = 'abstract_session'
    description = _('The name of the destination session')

    @classmethod
    def render(cls, abstract):
        if abstract.contribution and abstract.contribution.session:
            return abstract.contribution.session.title
        return ''


class ContributionTypePlaceholder(Placeholder):
    name = 'contribution_type'
    description = _('The contribution type that is associated to the abstract')

    @classmethod
    def render(cls, abstract):
        if abstract.state == AbstractState.withdrawn:
            ctype = abstract.accepted_contrib_type or abstract.submitted_contrib_type
        elif abstract.state == AbstractState.accepted:
            ctype = abstract.accepted_contrib_type
        else:
            ctype = abstract.submitted_contrib_type
        return ctype.name if ctype else ''


class PrimaryAuthorsPlaceholder(Placeholder):
    name = 'primary_authors'
    description = _('The names of the primary authors (separated by commas)')

    @classmethod
    def render(cls, contribution):
        return ', '.join(author.full_name for author in contribution.primary_authors)


class CoAuthorsPlaceholder(Placeholder):
    name = 'co_authors'
    description = _('The names of the co-authors (separated by commas)')

    @classmethod
    def render(cls, contribution):
        return ', '.join(author.full_name for author in contribution.secondary_authors)


class SubmitterNamePlaceholder(Placeholder):
    name = 'submitter_name'
    description = _('The full name of the submitter, no title')

    @classmethod
    def render(cls, contribution):
        return contribution.submitter.full_name


class SubmitterFirstNamePlaceholder(Placeholder):
    advanced = True
    name = 'submitter_first_name'
    description = _('The first name of the submitter')

    @classmethod
    def render(cls, contribution):
        return contribution.submitter.first_name


class SubmitterLastNamePlaceholder(Placeholder):
    advanced = True
    name = 'submitter_last_name'
    description = _('The last name of the submitter')

    @classmethod
    def render(cls, contribution):
        return contribution.submitter.last_name


class SubmitterTitlePlaceholder(Placeholder):
    name = 'submitter_title'
    description = _('The title of the submitter (Dr, Prof., etc...)')

    @classmethod
    def render(cls, contribution):
        return orig_string(contribution.submitter.title)


class ContributionURLPlaceholder(Placeholder):
    advanced = True
    name = 'contribution_url'
    description = _('Contribution URL')

    @classmethod
    def render(cls, contribution):
        return url_for('contributions.display_contribution', contribution, _external=True)


class JudgmentCommentPlaceholder(Placeholder):
    name = 'judgment_comment'
    description = _('Comments written by event organizer (upon final decision)')

    @classmethod
    def render(cls, abstract):
        return abstract.judgment_comment
