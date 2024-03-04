// This file is part of Indico.
// Copyright (C) 2002 - 2024 CERN
//
// Indico is free software; you can redistribute it and/or
// modify it under the terms of the MIT License; see the
// LICENSE file for more details.

export const SET_TIMETABLE_DATA = 'Set timetable data';
export const MOVE_ENTRY = 'Move entry';
export const RESIZE_ENTRY = 'Resize entry';
export const TOGGLE_COMPACT_MODE = 'Toggle compact mode';

export function setTimetableData(data) {
  return {type: SET_TIMETABLE_DATA, data};
}

export function moveEntry(entryId, {start, end, resourceId}) {
  return {type: MOVE_ENTRY, entryId, start, end, resourceId};
}

export function resizeEntry(entryId, {start, end}) {
  return {type: RESIZE_ENTRY, entryId, start, end};
}

export function toggleCompactMode() {
  return {type: TOGGLE_COMPACT_MODE};
}
