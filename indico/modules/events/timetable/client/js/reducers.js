// This file is part of Indico.
// Copyright (C) 2002 - 2024 CERN
//
// Indico is free software; you can redistribute it and/or
// modify it under the terms of the MIT License; see the
// LICENSE file for more details.

import _ from 'lodash';

import * as actions from './actions';
import {resizeEntry, preprocessEntries, resizeWindow, moveEntry, changeColor} from './util';

const entryTypeMapping = {
  Session: 'session',
  Break: 'break',
  Contribution: 'contribution',
};

const preprocessData = data => {
  // TODO remove this preprocessing once the backend returns the data in the correct format
  const blocks = Object.values(data)
    .map(e => Object.values(e))
    .flat();
  const childEntries = blocks
    .map(e => (e.entries ? Object.values(e.entries).map(v => ({...v, parentId: e.id})) : []))
    .flat();
  return [blocks, childEntries].map(en =>
    en.map(e => ({
      ..._.pick(e, ['id', 'title', 'slotTitle', 'code', 'sessionCode', 'description', 'parentId']),
      type: entryTypeMapping[e.entryType],
      start: new Date(Date.parse(`${e.startDate.date} ${e.startDate.time}`)),
      end: new Date(Date.parse(`${e.endDate.date} ${e.endDate.time}`)),
      attachmentCount: e.attachments?.files?.length + e.attachments?.folders.length, // TODO count files in folders
      color: e.entryType === 'Contribution' ? undefined : {text: e.textColor, background: e.color},
    }))
  );
};

export default {
  entries: (
    state = {blocks: [], children: [], changes: [], currentChangeIdx: 0, selectedId: null},
    action
  ) => {
    switch (action.type) {
      case actions.SET_TIMETABLE_DATA:
        return {...state, ...preprocessEntries(...preprocessData(action.data), state.changes)};
      case actions.MOVE_ENTRY:
        return {...state, ...moveEntry(state, action.args)};
      case actions.RESIZE_ENTRY:
        return {...state, ...resizeEntry(state, action.args)};
      case actions.SELECT_ENTRY:
        return {...state, selectedId: action.entry?.id};
      case actions.CHANGE_COLOR:
        return {...state, ...changeColor(state, action.entry, action.color)};
      case actions.UNDO_CHANGE:
        return {
          ...state,
          currentChangeIdx: state.currentChangeIdx - 1,
        };
      case actions.REDO_CHANGE:
        return {
          ...state,
          currentChangeIdx: state.currentChangeIdx + 1,
        };
      default:
        return state;
    }
  },
  navigation: (state = {numDays: 2, offset: 0}, action) => {
    switch (action.type) {
      case actions.SCROLL_NAVBAR:
        return {...state, offset: action.offset};
      case actions.RESIZE_WINDOW:
        return resizeWindow(state, action);
      default:
        return state;
    }
  },
  displayMode: (state = 'compact', action) => {
    switch (action.type) {
      case actions.SET_DISPLAY_MODE:
        return action.mode;
      default:
        return state;
    }
  },
};
