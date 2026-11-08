import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

export const getPost = postId => {
    const result = requestJson(`${getServerUrl()}/posts/${postId}`, {
        credentials: 'include',
    });
    return result;
};

export const deletePost = async postId => {
    const result = await requestJson(`${getServerUrl()}/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return result;
};

export const writeComment = async (pageId, comment) => {
    const result = await requestJson(`${getServerUrl()}/posts/${pageId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: comment }),
    });
    return result;
};

export const getComments = (
    postId,
    cursor = null,
    size = 10,
) => {
    const query = new URLSearchParams();

    if (cursor) {
        query.append('cursor', cursor);
    }

    query.append('size', size);

    const result = requestJson(
        `${getServerUrl()}/posts/${postId}/comments?${query.toString()}`,
        {
            credentials: 'include',
        },
    );

    return result;
};

export const likePost = async postId => {
    const result = await requestJson(`${getServerUrl()}/posts/${postId}/likes`, {
        method: 'POST',
        credentials: 'include',
    });
    return result;
};

export const unlikePost = async postId => {
    const result = await requestJson(`${getServerUrl()}/posts/${postId}/likes`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return result;
};
