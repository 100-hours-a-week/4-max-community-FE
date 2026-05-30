import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

export const createPost = boardData => {
    const result = requestJson(`${getServerUrl()}/v1/posts`, {
        method: 'POST',
        body: JSON.stringify(boardData),
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });
    return result;
};

export const updatePost = (postId, boardData) => {
    const result = requestJson(`${getServerUrl()}/v1/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify(boardData),
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    return result;
};

export const fileUpload = formData => {
    const result = requestJson(getServerUrl() + '/v1/posts/upload/attach-file', {
        method: 'POST',
        body: formData,
    });

    return result;
};

export const getBoardItem = postId => {
    const result = requestJson(getServerUrl() + `/v1/posts/${postId}`, {
        method: 'GET',
        credentials: 'include',
    });

    return result;
};
