import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

export const getPosts = (cursor = null, size = 10, keyword = '', signal) => {
    const query = new URLSearchParams({ size });
    if (cursor) {
        query.set('cursor', cursor);
    }
    if (keyword) {
        query.set('keyword', keyword);
    }

    return requestJson(`${getServerUrl()}/posts?${query.toString()}`, {
        credentials: 'include',
        signal,
    });
};
