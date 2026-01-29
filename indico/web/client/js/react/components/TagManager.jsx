// This file is part of Indico.
// Copyright (C) 2002 - 2026 CERN
//
// Indico is free software; you can redistribute it and/or
// modify it under the terms of the MIT License; see the
// LICENSE file for more details.

import PropTypes from 'prop-types';
import React, {useReducer} from 'react';
import {Button, Icon, Label, Loader, Message, Segment, Popup} from 'semantic-ui-react';

import {RequestConfirmDelete} from 'indico/react/components';
import {getChangedValues, handleSubmitError} from 'indico/react/forms';
import {Param, Translate} from 'indico/react/i18n';

import TagModal from './TagModal';

import './TagManager.module.scss';

const initialState = {
  tag: null,
  operation: null,
};

function tagsReducer(state, action) {
  switch (action.type) {
    case 'ADD_TAG':
      return {operation: 'add', tag: null};
    case 'EDIT_TAG':
      return {operation: 'edit', tag: action.tag};
    case 'DELETE_TAG':
      return {operation: 'delete', tag: action.tag};
    case 'CLEAR':
      return {...initialState};
    default:
      return state;
  }
}

export default function TagManager({
  tags,
  loading,
  onCreateTag,
  onEditTag,
  onDeleteTag,
  editTagLabel,
  deleteTagLabel,
  addTagLabel,
  createTagLabel,
  noTagsMessage,
  canEditTag,
  editDisabledReason,
  confirmDeleteText,
}) {
  const [state, dispatch] = useReducer(tagsReducer, initialState);

  const createTag = async formData => {
    try {
      await onCreateTag(formData);
    } catch (e) {
      return handleSubmitError(e);
    }
  };

  const editTag = async (tagId, tagData) => {
    try {
      await onEditTag(tagId, tagData);
    } catch (e) {
      return handleSubmitError(e);
    }
  };

  if (loading) {
    return <Loader inline="centered" active />;
  } else if (!tags) {
    return null;
  }

  const {operation, tag: currentTag} = state;
  return (
    <div styleName="tags-container">
      {tags.map(tag => (
        <Segment key={tag.id} styleName="tag-segment">
          <Label color={tag.color}>{tag.verboseTitle}</Label>
          <div styleName="tag-actions">
            <Popup
              on="hover"
              position="right center"
              disabled={canEditTag(tag) || !editDisabledReason}
              trigger={
                <span>
                  <Icon
                    name="pencil"
                    color="grey"
                    size="small"
                    title={editTagLabel}
                    onClick={() => dispatch({type: 'EDIT_TAG', tag})}
                    disabled={!canEditTag(tag)}
                    circular
                    inverted
                  />{' '}
                  <Icon
                    name="remove"
                    color="red"
                    size="small"
                    title={deleteTagLabel}
                    onClick={() => dispatch({type: 'DELETE_TAG', tag})}
                    disabled={!canEditTag(tag)}
                    circular
                    inverted
                  />
                </span>
              }
              content={editDisabledReason}
            />
          </div>
        </Segment>
      ))}
      {tags.length === 0 && <Message info content={noTagsMessage} />}
      <Button
        onClick={() => dispatch({type: 'ADD_TAG'})}
        disabled={!!operation}
        floated="right"
        icon="plus"
        content={addTagLabel}
        primary
      />
      {['add', 'edit'].includes(operation) && (
        <TagModal
          header={operation === 'edit' ? editTagLabel : createTagLabel}
          onSubmit={async (formData, form) => {
            if (operation === 'edit') {
              return await editTag(currentTag.id, getChangedValues(formData, form));
            } else {
              return await createTag(formData);
            }
          }}
          tag={currentTag}
          onClose={() => dispatch({type: 'CLEAR'})}
        />
      )}
      <RequestConfirmDelete
        onClose={() => dispatch({type: 'CLEAR'})}
        requestFunc={() => onDeleteTag(currentTag.id)}
        open={operation === 'delete'}
      >
        {currentTag && confirmDeleteText(currentTag)}
      </RequestConfirmDelete>
    </div>
  );
}

TagManager.propTypes = {
  tags: PropTypes.array,
  loading: PropTypes.bool,
  onCreateTag: PropTypes.func.isRequired,
  onEditTag: PropTypes.func.isRequired,
  onDeleteTag: PropTypes.func.isRequired,
  editTagLabel: PropTypes.string,
  deleteTagLabel: PropTypes.string,
  addTagLabel: PropTypes.string,
  createTagLabel: PropTypes.string,
  noTagsMessage: PropTypes.string,
  canEditTag: PropTypes.func,
  editDisabledReason: PropTypes.string,
  confirmDeleteText: PropTypes.func,
};

TagManager.defaultProps = {
  tags: null,
  loading: false,
  editTagLabel: Translate.string('Edit tag'),
  deleteTagLabel: Translate.string('Delete tag'),
  addTagLabel: Translate.string('Add new tag'),
  createTagLabel: Translate.string('Create a new tag'),
  noTagsMessage: Translate.string('There are no tags defined for this event'),
  canEditTag: () => true,
  editDisabledReason: '',
  confirmDeleteText: tag => (
    <Translate>
      Are you sure you want to delete the tag{' '}
      <Param name="tag" value={tag.verboseTitle} wrapper={<strong />} />?
    </Translate>
  ),
};
