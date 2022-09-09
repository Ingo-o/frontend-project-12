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
}

const feedsState = {
  feeds: [],
  feedsCount: 0,
  posts: [],
  postsCount: 0,
}

//TODO подумать как сделать так, чтобы рендеры не вызывались по 10 раз

const watchedObject = onChange(state, (path, value, previousValue) => {
  if (path === 'inputValue') {
    const onFulfilled = (result) => {
      watchedObject.errors = '';
      watchedObject.isValid = true;
      getRss(value)
        .then((response) => parseRss(response.data.contents, value))
        .then((result) => {
          watchedFeeds.feeds = feedsState.feeds.concat(result.feeds);
          watchedFeeds.posts = feedsState.posts.concat(result.posts);
          updatePosts();
        })
        .then(() => { watchedObject.success = 'Rss успешно загружен' })
        .catch((error) => {
            //TODO вывести ошибку в нужное место
            console.log(error);
          });
    };
    const onRejected = (error) => {
      watchedObject.errors = error.message;
      watchedObject.isValid = false;
    };
    schema.validate(state, { abortEarly: false }).then(onFulfilled, onRejected);
  }
  render(state);
});

const watchedFeeds = onChange(feedsState, (path, value, previousValue) => {
  console.log(feedsState);
  renderFeeds(feedsState);
});

i18next.init({
  lng: 'ru',
  debug: true,
  resources: resources,
});

const schema = yup.object().shape({
  //TODO добавить проверку что данного фида еще нет в состоянии
  inputValue: yup.string().required(i18next.t('blankField')).url(i18next.t('incorrectUrl')),
});

const parseRss = (xml, linkToFeed) => {
  const result = {
    feeds: [],
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
  items.forEach((item) => {
    const postObj = {
      title: item.querySelector('title').textContent,
      description: item.querySelector('description').textContent,
      link: item.querySelector('link').textContent,
      feedID: feed.feedID,
      postID: feedsState.postsCount,
    };
    result.posts.push(postObj);
    feedsState.postsCount += 1;
  })
  feedsState.feedsCount +=1;
  return result;
}

const getRss = (linkToFeed) =>
  //TODO посмотреть как отключить кеш в прокси
  axios.get(`https://allorigins.hexlet.app/get?url=${encodeURIComponent(linkToFeed)}`);

const updatePosts = () => {
  console.log('Вызов функции апдейта постов')
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
  watchedObject.inputValue = urlInput.value;
})

// View
// Отрисовка UI и взаимодействие с DOM

const feedback = document.querySelector('.feedback');

const render = (state) => {
  console.log(state);
  feedback.textContent = state.errors;
  feedback.classList.remove('text-success');
  feedback.classList.add('text-danger')
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
      a.classList.add('fw-normal', 'link-secondary');
      a.href = post.link;
      a.textContent = post.title;
      a.setAttribute('data-id', post.postID);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      const button = document.createElement('button');
      button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      button.textContent = 'Просмотр';
      button.setAttribute('type', 'button');
      button.setAttribute('data-id', post.postID);
      button.setAttribute('data-bs-toggle', 'modal');
      button.setAttribute('data-bs-target', '#modal');
      li.appendChild(a);
      li.appendChild(button);
      ul.appendChild(li);
    })

    divCard.appendChild(divCardBody);
    divCard.appendChild(ul);
    divPosts.appendChild(divCard);
  }
}
