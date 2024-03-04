// This file is part of Indico.
// Copyright (C) 2002 - 2024 CERN
//
// Indico is free software; you can redistribute it and/or
// modify it under the terms of the MIT License; see the
// LICENSE file for more details.

import noOverlap from 'react-big-calendar/lib/utils/layout-algorithms/no-overlap';

import {getConcurrentEntries, hasChild, hasParent} from './util';

import styles from './Timetable.module.scss';

const SESSION_BLOCK_WIDTH = 10;

const makeTranslucent = hex => {
  if (!hex) {
    return undefined;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.8)`;
};

export const entryStyleGetter = entries => entry => {
  if (hasParent(entry)) {
    const parent = entries.find(e => e.id === entry.parent);
    return {
      style: {
        color: parent.color?.text,
        backgroundColor: makeTranslucent(parent.color?.background),
        borderColor: makeTranslucent(parent.color?.background),
      },
      className: styles['child-entry'],
    };
  }
  return {
    style: {
      color: entry.color?.text,
      backgroundColor: entry.color?.background,
      borderColor: entry.color?.background,
    },
    className: hasChild(entry, entries) ? styles['parent-entry'] : undefined,
  };
};

export const tooltipAccessor = entries => entry => {
  if (hasChild(entry, entries)) {
    return entry.title;
  }
  return null;
};

export const layoutAlgorithm = (allEntries, numColumns, compact) => props =>
  noOverlap(props).map(styledEntry => {
    // if it's a child-entry, remove the padding, and make it wider if in compact mode
    if (hasParent(styledEntry.event)) {
      const size = compact
        ? (100 - SESSION_BLOCK_WIDTH) / (100 / styledEntry.size - 1)
        : styledEntry.size;
      const left = compact
        ? SESSION_BLOCK_WIDTH + size * (styledEntry.idx - 1)
        : styledEntry.style.left;
      const style = {
        ...styledEntry.style,
        left,
        width: `${size}%`,
        xOffset: `${left}%`,
      };
      return {...styledEntry, size, style};
    }
    // make entries take up the full width if there are no concurrencies
    if (getConcurrentEntries(styledEntry.event, allEntries).length === 0) {
      const size = 100 * numColumns;
      const padding = 10 * (numColumns - 1) - (styledEntry.idx === 0 ? 0 : 3);
      const style = {...styledEntry.style, width: `calc(${size}% + ${padding}px)`};
      return {...styledEntry, size, style};
    }
    // entries with children are squeezed when in compact mode
    if (compact && hasChild(styledEntry.event, props.events)) {
      const style = {
        ...styledEntry.style,
        width: `${SESSION_BLOCK_WIDTH}%`,
      };
      return {...styledEntry, size: SESSION_BLOCK_WIDTH, style};
    }
    return styledEntry;
  });