// Import our custom CSS
import './scss/styles.scss';
// Import all of Bootstrap's JS
//import * as bootstrap from 'bootstrap';
import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import resources from './locales/index.js';
import axios from 'axios';

// https://stopgame.ru/rss/rss_news.xml
// https://ru.hexlet.io/lessons.rss
//TODO почитать побольше про архитектуру и перенести функции в нужные части приложения

// Model
// Состояние, данные и логика приложения

const state = {
  inputValue: '',
  isValid: true,
  isActive: true,
  errors: '',
  success: '',
  lng: 'ru',
  modal: {
    isModalActive: false,
    postID: '',
  }
}

const feedsState = {
  feeds: [],
  feedsLinks: [],
  feedsCount: 0,
  posts: [],
  postsCount: 0,
}


const watchedObject = onChange(state, (path, value) => {
  if (path === 'inputValue') {
      getRss(value)
        .catch((error) => {
          console.log(error);
          watchedObject.errors = i18next.t('networkError');
        })
        .then((response) => parseRss(response.data.contents, value))
        .catch((error) => {
          console.log(error);
          watchedObject.errors = i18next.t('notValidRss');
        })
        .then((result) => {
          watchedFeeds.feeds = feedsState.feeds.concat(result.feeds);
          watchedFeeds.posts = feedsState.posts.concat(result.posts);
          watchedFeeds.feedsLinks = feedsState.feedsLinks.concat(result.feedsLinks);
          updatePosts();
        })
        .then(() => { watchedObject.success = i18next.t('rssLoaded') })
        .catch((error) => {
            console.log(error);
          });
  }
  render(state);
  renderFeeds(feedsState);
});

const watchedFeeds = onChange(feedsState, () => {
  renderFeeds(feedsState);
});

i18next.init({
  lng: 'ru',
  debug: true,
  resources: resources,
});

const parseRss = (xml, linkToFeed) => {
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
      linkToFeed: linkToFeed,
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
  })
  feedsState.feedsCount +=1;
  return result;
}

const getRss = (linkToFeed) =>
  axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(linkToFeed)}`);

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
        })
    });
  }
};

// Controller
// Обработчики

const sendButton = document.querySelector('form button');
const urlInput = document.querySelector('#url-input');

sendButton.addEventListener('click', (event) => {
  event.preventDefault();
  const schema = yup.string().required(i18next.t('blankField')).url(i18next.t('incorrectUrl')).notOneOf(feedsState.feedsLinks, i18next.t('rssAlreadyExists'));
  const onFulfilled = () => {
    watchedObject.inputValue = urlInput.value;
  }
  const onRejected = (error) => {
    watchedObject.errors = error.message;
    watchedObject.isValid = false;
  };
  schema.validate(urlInput.value).then(onFulfilled, onRejected);
})

const showModal = (event) => {
  event.preventDefault();
  watchedObject.modal.isModalActive = true;
  const postID = event.target.getAttribute('data-id');
  watchedObject.modal.postID = postID;
  // помечаем открытый пост как просмотренный
  watchedFeeds.posts.forEach((post) => {
    if (post.postID === +postID) {
      post.isViewed = true
    }
  })
};

const closeModal = (event) => {
  event.preventDefault();
  watchedObject.modal.isModalActive = false;
};


// View
// Отрисовка UI и взаимодействие с DOM

const feedback = document.querySelector('.feedback');

const render = (state) => {
  feedback.textContent = state.errors;
  feedback.classList.remove('text-success');
  feedback.classList.add('text-danger');
  if (state.isValid === true) {
    urlInput.classList.remove('is-invalid');
  } else {
    urlInput.classList.add('is-invalid');
  }
  if (state.success !== '') {
    feedback.textContent = state.success;
    feedback.classList.remove('text-danger');
    feedback.classList.add('text-success');
    state.success = '';
  }
  if (state.modal.isModalActive) {
    const modal = document.querySelector('.modal');
    modal.classList.add('show');
    modal.setAttribute('style', 'display: block;');
    modal.setAttribute('aria-modal', 'true');
    modal.removeAttribute('aria-hidden');
    const modalTitle = document.querySelector('.modal-title');
    const post = feedsState.posts.filter((post) => post.postID === +state.modal.postID)[0];
    modalTitle.textContent = post.title;
    const modalBody = document.querySelector('.modal-body');
    modalBody.textContent = post.description;
    const readButton = document.querySelector('.modal-footer a');
    readButton.href = post.link;
    const closeIcon = document.querySelector('.modal-header button');
    const closeButton = document.querySelector('.modal-footer button');
    closeIcon.addEventListener('click', closeModal);
    closeButton.addEventListener('click', closeModal);
  }
  if (!state.modal.isModalActive) {
    const modal = document.querySelector('.modal');
    modal.classList.remove('show');
    modal.removeAttribute('style');
    modal.removeAttribute('aria-modal');
    modal.setAttribute('aria-hidden', 'true');
  }
};

const renderFeeds = (feedsState) => {

  const divFeeds = document.querySelector('.feeds');
  divFeeds.textContent = '';

  if (feedsState.feeds.length !== 0) {

    const divCard = document.createElement('div');
    divCard.classList.add('card', 'border-0');
    const divCardBody = document.createElement('div');
    divCardBody.classList.add('card-body');
    const h2 = document.createElement('h2');
    h2.classList.add('card-title', 'h4');
    h2.textContent = 'Фиды';
    divCardBody.appendChild(h2);

    const ul = document.createElement('ul');
    ul.classList.add('list-group', 'border-0', 'rounded-0');
    feedsState.feeds.forEach((feed) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'border-0', 'border-end-0');
      const h3 = document.createElement('h3');
      h3.classList.add('h6', 'm-0');
      h3.textContent = feed.title;
      const p = document.createElement('p');
      p.classList.add('m-0', 'small', 'text-black-50');
      p.textContent = feed.description;
      li.appendChild(h3);
      li.appendChild(p);
      ul.appendChild(li);
    })

    divCard.appendChild(divCardBody);
    divCard.appendChild(ul);
    divFeeds.appendChild(divCard);
  }

  const divPosts = document.querySelector('.posts');
  divPosts.textContent = '';

  if (feedsState.posts.length !== 0) {

    const divCard = document.createElement('div');
    divCard.classList.add('card', 'border-0');
    const divCardBody = document.createElement('div');
    divCardBody.classList.add('card-body');
    const h2 = document.createElement('h2');
    h2.classList.add('card-title', 'h4');
    h2.textContent = 'Посты';
    divCardBody.appendChild(h2);

    const ul = document.createElement('ul');
    ul.classList.add('list-group', 'border-0', 'rounded-0');
    feedsState.posts.forEach((post) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
      const a = document.createElement('a');
      if (post.isViewed) {
        a.classList.remove('fw-bold');
        a.classList.add('fw-normal');
      }
      if (!post.isViewed) {
        a.classList.remove('fw-normal');
        a.classList.add('fw-bold');
      }
      a.classList.add('link-secondary');
      a.href = post.link;
      a.textContent = post.title;
      a.setAttribute('data-id', post.postID);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      const button = document.createElement('button');
      button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      button.textContent = i18next.t('view');
      button.setAttribute('type', 'button');
      button.setAttribute('data-id', post.postID);
      button.setAttribute('data-bs-toggle', 'modal');
      button.setAttribute('data-bs-target', '#modal');
      button.addEventListener('click', showModal);
      li.appendChild(a);
      li.appendChild(button);
      ul.appendChild(li);
    })

    divCard.appendChild(divCardBody);
    divCard.appendChild(ul);
    divPosts.appendChild(divCard);
  }

}
