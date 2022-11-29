// This file is part of Indico.
// Copyright (C) 2002 - 2022 CERN
//
// Indico is free software; you can redistribute it and/or
// modify it under the terms of the MIT License; see the
// LICENSE file for more details.

import PropTypes from 'prop-types';
import React from 'react';
import {Table} from 'semantic-ui-react';

import {Translate} from 'indico/react/i18n';

// TODO: implement sorting by column
// TODO: implement filters
export default function PersonList({persons, extraRoles}) {
  // DEBUG:
  console.log(persons);

  const roles = [
    ...extraRoles,
    {
      icon: 'mic',
      isActive: p => p.speaker,
      titleActive: Translate.string('This person is a speaker'),
      titleInactive: Translate.string('This person is not a speaker'),
    },
  ];

  return (
    <Table sortable selectable>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell />
          <Translate as={Table.HeaderCell}>Name</Translate>
          <Translate as={Table.HeaderCell}>Email</Translate>
          <Translate as={Table.HeaderCell}>Affiliation</Translate>
          <Translate as={Table.HeaderCell}>Author type</Translate>
          <Translate as={Table.HeaderCell}>Roles</Translate>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {persons.map(person => (
          <Table.Row key={person.id} disabled={!person.email}>
            <Table.Cell />
            <Table.Cell>{person.fullName}</Table.Cell>
            <Table.Cell>{person.email}</Table.Cell>
            <Table.Cell>{person.affiliation}</Table.Cell>
            <Table.Cell />
            <Table.Cell>
              {roles.map(({icon, isActive, titleActive, titleInactive}) => (
                <i
                  key={icon}
                  className={`icon-${icon} ${!isActive(person) && 'inactive'}`}
                  title={isActive(person) ? titleActive : titleInactive}
                />
              ))}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

PersonList.propTypes = {
  persons: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      fullName: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      affiliation: PropTypes.string.isRequired,
      speaker: PropTypes.bool.isRequired,
      primaryAuthor: PropTypes.bool.isRequired,
      secondaryAuthor: PropTypes.bool.isRequired,
      notRegistered: PropTypes.bool.isRequired,
    })
  ).isRequired,
  extraRoles: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.string.isRequired,
      isActive: PropTypes.func.isRequired,
      titleActive: PropTypes.string.isRequired,
      titleInactive: PropTypes.string.isRequired,
    })
  ),
};

PersonList.defaultProps = {extraRoles: []};
