// This file is part of Indico.
// Copyright (C) 2002 - 2026 CERN
//
// Indico is free software; you can redistribute it and/or
// modify it under the terms of the MIT License; see the
// LICENSE file for more details.

import PropTypes from 'prop-types';
import React from 'react';
import {useSelector} from 'react-redux';

import {FinalAffiliationField} from 'indico/react/components';
import {FinalDropdown} from 'indico/react/forms';
import {Translate} from 'indico/react/i18n';
import {getPluginObjects} from 'indico/utils/plugins';

import {getStaticData} from '../selectors';

import './AffiliationInput.module.scss';

function AffiliationInputBase({htmlId, htmlName, disabled, isRequired, affiliationMode, fieldId}) {
  const {hasPredefinedAffiliations, regformId} = useSelector(getStaticData);
  const usePredefinedAffiliations = hasPredefinedAffiliations && affiliationMode !== 'custom';

  return (
    <FinalAffiliationField
      id={htmlId}
      name={htmlName}
      styleName="affiliation-dropdown"
      hasPredefinedAffiliations={usePredefinedAffiliations}
      allowCustomAffiliations={affiliationMode !== 'predefined'}
      searchParams={{regform_id: regformId, field_id: fieldId}}
      noPredefinedInputProps={{
        format: value => (value && typeof value === 'object' ? value.text || '' : value || ''),
        parse: value => ({id: null, text: value}),
        formatOnBlur: false,
      }}
      required={isRequired}
      disabled={disabled}
      validate={value =>
        isRequired && !value?.text ? Translate.string('This field is required.') : undefined
      }
      includeMeta
    />
  );
}

AffiliationInputBase.propTypes = {
  htmlId: PropTypes.string.isRequired,
  htmlName: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  isRequired: PropTypes.bool.isRequired,
  affiliationMode: PropTypes.oneOf(['both', 'predefined', 'custom']).isRequired,
  fieldId: PropTypes.number.isRequired,
};

AffiliationInputBase.defaultProps = {
  disabled: false,
};

export default function AffiliationInput(props) {
  const pluginEntry = getPluginObjects('regform-affiliation-input')[0];
  if (pluginEntry) {
    const Component = pluginEntry.component || pluginEntry;
    const extraProps = pluginEntry.props || {};
    return <Component {...extraProps} {...props} BaseComponent={AffiliationInputBase} />;
  }
  return <AffiliationInputBase {...props} />;
}

export const affiliationSettingsInitialData = {
  affiliationMode: 'both',
};

export function AffiliationSettings() {
  const {hasPredefinedAffiliations} = useSelector(getStaticData);
  if (!hasPredefinedAffiliations) {
    return null;
  }
  return (
    <FinalDropdown
      name="affiliationMode"
      label={Translate.string('Allowed affiliations')}
      options={[
        {value: 'both', text: Translate.string('Predefined and custom affiliations')},
        {value: 'predefined', text: Translate.string('Only predefined affiliations')},
        {value: 'custom', text: Translate.string('Only custom affiliations')},
      ]}
      selection
      required
      fluid
    />
  );
}
