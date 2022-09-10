// Import our custom CSS
import './scss/styles.scss';
// Import all of Bootstrap's JS
// import * as bootstrap from 'bootstrap';
import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import resources from './locales/index.js';
import state from './utils/state.js';
import feedsState from './utils/feedsState.js';
// View
// Отрисовка UI и взаимодействие с DOM
import render from './utils/render.js';
import renderFeeds from './utils/renderFeeds.js';

// https://stopgame.ru/rss/rss_news.xml
// https://ru.hexlet.io/lessons.rss
// TODO почитать побольше про архитектуру и перенести функции в нужные части приложения

// Model
// Состояние, данные и логика приложения

const watchedObject = onChange(state, () => {
  render(state);
  renderFeeds(feedsState);
});

const watchedFeeds = onChange(feedsState, () => {
  renderFeeds(feedsState);
});

i18next.init({
  lng: 'ru',
  debug: true,
  resources,
});

const disableFormInput = () => {
  watchedObject.isActive = false;
};
const enableFormInput = () => {
  watchedObject.isActive = true;
};

const parseRss = (xml, linkToFeed) => {
  try {
    const result = {
      feeds: [],
      feedsLinks: [],
      posts: [],
    };
    const parser = new DOMParser();
    const data = parser.parseFromString(xml, 'application/xml');
    const items = data.querySelectorAll('item');
    const feed = {
      title: data.querySelector('channel title').textContent,
      description: data.querySelector('channel description').textContent,
      linkToFeed,
      feedID: feedsState.feedsCount,
    };
    result.feeds.push(feed);
    result.feedsLinks.push(linkToFeed);
    items.forEach((item) => {
      const postObj = {
        title: item.querySelector('title').textContent,
        description: item.querySelector('description').textContent,
        link: item.querySelector('link').textContent,
        feedID: feed.feedID,
        postID: feedsState.postsCount,
        isViewed: false,
      };
      result.posts.push(postObj);
      feedsState.postsCount += 1;
    });
    feedsState.feedsCount += 1;
    return result;
  } catch (error) {
    throw Error(i18next.t('notValidRss'));
  }
};

const getRss = (linkToFeed) => axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(linkToFeed)}`).catch(() => { throw Error('networkError'); });

const updatePosts = () => {
  if (feedsState.feeds.length > 0) {
    feedsState.feeds.forEach((feed) => {
      getRss(feed.linkToFeed)
        .then((response) => parseRss(response.data.contents, feed.linkToFeed))
        .then((result) => {
          const currentPostTitles = feedsState.posts.map((post) => post.title);
          const newPosts = result.posts.filter((post) => !currentPostTitles.includes(post.title));
          watchedFeeds.posts.push(...newPosts);
        })
        .then(() => {
          setTimeout(updatePosts, 5000);
        });
    });
  }
};

// Controller
// Обработчики

const sendButton = document.querySelector('form button');
const urlInput = document.querySelector('#url-input');

sendButton.addEventListener('click', (event) => {
  event.preventDefault();
  disableFormInput();
  const schema = yup.string().required('blankField').url('incorrectUrl').notOneOf(feedsState.feedsLinks, 'rssAlreadyExists');
  schema.validate(urlInput.value)
    .then((link) => getRss(link))
    .then((response) => parseRss(response.data.contents, urlInput.value))
    .then((result) => {
      watchedFeeds.feeds = feedsState.feeds.concat(result.feeds);
      watchedFeeds.posts = feedsState.posts.concat(result.posts);
      watchedFeeds.feedsLinks = feedsState.feedsLinks.concat(result.feedsLinks);
    })
    .then(() => {
      enableFormInput();
      watchedObject.errors = '';
      watchedObject.isValid = true;
      urlInput.value = '';
      watchedObject.success = i18next.t('rssLoaded');
      updatePosts();
    })
    .catch((error) => {
      console.log(error);
      watchedObject.errors = i18next.t(error.message);
      watchedObject.isValid = false;
      enableFormInput();
    });
});

const showModal = (event) => {
  event.preventDefault();
  watchedObject.modal.isModalActive = true;
  const postID = event.target.getAttribute('data-id');
  watchedObject.modal.postID = postID;
  // помечаем открытый пост как просмотренный
  watchedFeeds.posts.forEach((post) => {
    if (post.postID === +postID) {
      post.isViewed = true;
    }
  });
};

const closeModal = (event) => {
  event.preventDefault();
  watchedObject.modal.isModalActive = false;
};

const posts = document.querySelector('.posts');
posts.addEventListener('click', (event) => {
  if (event.target.tagName === 'BUTTON') {
    showModal(event);
  }
});

const modal = document.querySelector('.modal');
modal.addEventListener('click', (event) => {
  if (event.target.tagName === 'BUTTON' && (event.target.classList.contains('btn-close') || event.target.classList.contains('btn-secondary'))) {
    closeModal(event);
  }
});
