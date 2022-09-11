import i18next from 'i18next';
import feedsState from './feedsState.js';

export default (xml, linkToFeed) => {
  try {
    const parser = new DOMParser();
    const data = parser.parseFromString(xml, 'application/xml');
    const items = Array.from(data.querySelectorAll('item'));
    const feed = {
      title: data.querySelector('channel title').textContent,
      description: data.querySelector('channel description').textContent,
      linkToFeed,
      feedID: feedsState.feedsCount,
    };
    const posts = items.map((item) => {
      feedsState.postsCount += 1;
      return {
        title: item.querySelector('title').textContent,
        description: item.querySelector('description').textContent,
        link: item.querySelector('link').textContent,
        feedID: feed.feedID,
        postID: feedsState.postsCount,
        isViewed: false,
      };
    });
    feedsState.feedsCount += 1;
    return { feed, linkToFeed, posts };
  } catch (error) {
    throw Error(i18next.t('notValidRss'));
  }
};
