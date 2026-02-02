// This file is part of Indico.
// Copyright (C) 2002 - 2026 CERN
//
// Indico is free software; you can redistribute it and/or
// modify it under the terms of the MIT License; see the
// LICENSE file for more details.

import PropTypes from 'prop-types';
import React from 'react';
import {Label} from 'semantic-ui-react';

import {FinalDropdown, FinalInput} from 'indico/react/forms';
import {FinalModalForm} from 'indico/react/forms/final-form';
import {Translate} from 'indico/react/i18n';
import {SUIPalette} from 'indico/utils/palette';

const renderColorLabel = colorName => (
  <div style={{display: 'flex', alignItems: 'center'}}>
    <Label color={colorName} /> <span style={{marginLeft: 10}}>{SUIPalette[colorName]}</span>
  </div>
);

const availableColors = Object.keys(SUIPalette).map(colorName => ({
  text: renderColorLabel(colorName),
  value: colorName,
}));

export default function TagModal({header, onSubmit, tag, onClose, hasColors, extraFields}) {
  const handleSubmit = async (formData, form) => {
    const error = await onSubmit(formData, form);
    if (error) {
      return error;
    }
    onClose();
  };

  return (
    <FinalModalForm
      id="tag-form"
      onSubmit={handleSubmit}
      onClose={onClose}
      initialValues={tag}
      header={header}
    >
      <FinalInput name="code" label={Translate.string('Code')} required autoFocus />
      <FinalInput name="title" label={Translate.string('Title')} required />
      {hasColors && (
        <FinalDropdown
          name="color"
          label={Translate.string('Color')}
          options={availableColors}
          search={null}
          selection
          required
        />
      )}
      {extraFields}
    </FinalModalForm>
  );
}

TagModal.propTypes = {
  header: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  tag: PropTypes.object,
  onClose: PropTypes.func,
  hasColors: PropTypes.bool,
  extraFields: PropTypes.node,
};

TagModal.defaultProps = {
  tag: {
    code: null,
    title: null,
    color: null,
  },
  onClose: null,
  hasColors: true,
  extraFields: null,
};
