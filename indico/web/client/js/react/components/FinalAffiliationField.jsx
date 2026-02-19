// This file is part of Indico.
// Copyright (C) 2002 - 2026 CERN
//
// Indico is free software; you can redistribute it and/or
// modify it under the terms of the MIT License; see the
// LICENSE file for more details.

import searchAffiliationURL from 'indico-url:users.api_affiliations';

import PropTypes from 'prop-types';
import React, {useMemo, useState} from 'react';
import {useField} from 'react-final-form';
import {Header} from 'semantic-ui-react';

import {FinalComboDropdown, FinalInput} from 'indico/react/forms';
import {useIndicoAxios} from 'indico/react/hooks';
import {Translate} from 'indico/react/i18n';
import {makeAsyncDebounce} from 'indico/utils/debounce';

const debounce = makeAsyncDebounce(250);

function getSubheader({city, countryName, country_name: countryNameSnake}) {
  const country = countryName || countryNameSnake;
  if (city && country) {
    return `${city}, ${country}`;
  }
  return city || country;
}

export default function FinalAffiliationField({
  name,
  allowCustomAffiliations,
  hasPredefinedAffiliations,
  currentAffiliation,
  includeMeta,
  searchParams,
  noPredefinedInputName,
  noPredefinedInputProps,
  styleName,
  ...rest
}) {
  const valueFieldName = hasPredefinedAffiliations ? name : noPredefinedInputName || name;
  const {
    input: {value: currentValue},
  } = useField(valueFieldName, {subscription: {value: true}});
  const [searchQuery, setSearchQuery] = useState('');
  const {data: fetchedAffiliationResults} = useIndicoAxios(
    searchAffiliationURL({q: searchQuery, ...searchParams}),
    {manual: !searchQuery, camelize: true}
  );
  const affiliationResults = useMemo(
    () => fetchedAffiliationResults || [],
    [fetchedAffiliationResults]
  );

  const affiliationOptions = useMemo(() => {
    const selectedAffiliation =
      currentAffiliation ||
      (currentValue && typeof currentValue === 'object' && currentValue.id !== null
        ? {id: currentValue.id, name: currentValue.text, ...(currentValue.meta || {})}
        : null);
    const results =
      selectedAffiliation && !affiliationResults.find(x => x.id === selectedAffiliation.id)
        ? [selectedAffiliation, ...affiliationResults]
        : affiliationResults;
    return results.map(res => ({
      key: res.id,
      value: res.id,
      meta: res,
      text: `${res.name} `, // space allows addition even if it matches a result
      content: <Header style={{fontSize: 14}} content={res.name} subheader={getSubheader(res)} />,
    }));
  }, [affiliationResults, currentAffiliation, currentValue]);

  const searchAffiliationChange = (e, {searchQuery: query}) => {
    if (!query) {
      setSearchQuery('');
      return;
    }
    debounce(() => setSearchQuery(query));
  };

  if (!hasPredefinedAffiliations) {
    return (
      <FinalInput name={noPredefinedInputName || name} {...rest} {...noPredefinedInputProps} />
    );
  }

  return (
    <FinalComboDropdown
      name={name}
      styleName={styleName}
      options={affiliationOptions}
      allowAdditions={allowCustomAffiliations}
      includeMeta={includeMeta}
      additionLabel={Translate.string('Use custom affiliation:') + ' '} // eslint-disable-line prefer-template
      onSearchChange={searchAffiliationChange}
      search={options => [
        ...(options.find(o => o.key === 'addition') || []),
        ...options.filter(o => o.key !== 'addition'),
      ]}
      placeholder={
        allowCustomAffiliations
          ? Translate.string('Select an affiliation or add your own')
          : Translate.string('Select an affiliation')
      }
      noResultsMessage={
        allowCustomAffiliations
          ? Translate.string('Search an affiliation or enter one manually')
          : Translate.string('Search an affiliation')
      }
      renderCustomOptionContent={value => (
        <Header content={value} subheader={Translate.string('You entered this option manually')} />
      )}
      {...rest}
    />
  );
}

FinalAffiliationField.propTypes = {
  name: PropTypes.string.isRequired,
  allowCustomAffiliations: PropTypes.bool,
  hasPredefinedAffiliations: PropTypes.bool,
  currentAffiliation: PropTypes.object,
  includeMeta: PropTypes.bool,
  searchParams: PropTypes.object,
  noPredefinedInputName: PropTypes.string,
  noPredefinedInputProps: PropTypes.object,
  styleName: PropTypes.string,
};

FinalAffiliationField.defaultProps = {
  allowCustomAffiliations: true,
  hasPredefinedAffiliations: true,
  currentAffiliation: null,
  includeMeta: false,
  searchParams: {},
  noPredefinedInputName: null,
  noPredefinedInputProps: {},
  styleName: null,
};
