// This file is part of Indico.
// Copyright (C) 2002 - 2026 CERN
//
// Indico is free software; you can redistribute it and/or
// modify it under the terms of the MIT License; see the
// LICENSE file for more details.

import createTagURL from 'indico-url:event_editing.api_create_tag';
import editTagURL from 'indico-url:event_editing.api_edit_tag';
import tagsURL from 'indico-url:event_editing.api_tags';

import React from 'react';

import {useIndicoAxios} from 'indico/react/hooks';
import {Translate} from 'indico/react/i18n';
import {handleAxiosError, indicoAxios} from 'indico/utils/axios';

import TagManager from './TagManager';

interface TagFormData {
  code: string;
  name: string;
  color: string;
}

interface EditingTag extends TagFormData {
  id: number;
  verboseTitle: string;
  system: boolean;
}

export default function EditingTagManager({eventId}: {eventId: number}) {
  const {data, loading, reFetch, lastData} = useIndicoAxios(tagsURL({event_id: eventId}), {
    camelize: true,
  });

  const handleCreateTag = async (formData: TagFormData) => {
    await indicoAxios.post(createTagURL({event_id: eventId}), formData);
    reFetch();
  };

  const handleEditTag = async (tagId: number, tagData: TagFormData) => {
    await indicoAxios.patch(editTagURL({event_id: eventId, tag_id: tagId}), tagData);
    reFetch();
  };

  const handleDeleteTag = async (tagId: number) => {
    try {
      await indicoAxios.delete(editTagURL({event_id: eventId, tag_id: tagId}));
      reFetch();
    } catch (e) {
      handleAxiosError(e);
      return true;
    }
  };

  const tags = data || lastData;
  return (
    <TagManager
      tags={tags}
      loading={loading && !lastData}
      onCreateTag={handleCreateTag}
      onEditTag={handleEditTag}
      onDeleteTag={handleDeleteTag}
      canEditTag={(tag: EditingTag) => !tag.system}
      editDisabledReason={Translate.string(
        'System tags are managed by the editing workflow service and cannot be modified.'
      )}
    />
  );
}
