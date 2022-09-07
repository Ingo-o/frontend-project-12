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
  lng: 'ru',
}

const feedsState = {
  feeds: [],
  posts: [],
}

const watchedObject = onChange(state, (path, value, previousValue) => {
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
  const parser = new DOMParser();
  const data = parser.parseFromString(xml, 'application/xml');
  const items = data.querySelectorAll('item');
  const feed = {
      title: data.querySelector('channel title').textContent,
      description: data.querySelector('channel description').textContent,
      linkToFeed: linkToFeed,
    };
  watchedFeeds.feeds.push(feed);
  items.forEach((item) => {
    const itemObj = {
      title: item.querySelector('title').textContent,
      description: item.querySelector('description').textContent,
      link: item.querySelector('link').textContent,
    }
    watchedFeeds.posts.push(itemObj);
  })
}

const getRss = () => {
  const linkToFeed = state.inputValue;
  //TODO посмотреть как отключить кеш в прокси
  axios.get(`https://allorigins.hexlet.app/get?url=${encodeURIComponent(linkToFeed)}`)
    .then((response) => {
      parseRss(response.data.contents, linkToFeed);
    })
    .catch((error) => {
      //TODO вывести ошибку в нужное место
      console.log(error);
    })
}

const onFulfilled = (result) => {
  watchedObject.errors = '';
  watchedObject.isValid = true;
  getRss();
  //TODO вывести сообщение об успешной загрузке RSS
}

const onRejected = (error) => {
  watchedObject.errors = error.message;
  watchedObject.isValid = false;
}

const validate = (fields) => schema.validate(fields, { abortEarly: false }).then(onFulfilled, onRejected);

// Controller
// Обработчики

const sendButton = document.querySelector('form button');
const urlInput = document.querySelector('#url-input');

sendButton.addEventListener('click', (event) => {
  event.preventDefault();
  watchedObject.inputValue = urlInput.value;
  watchedObject.errors = validate(state);
})

// View
// Отрисовка UI и взаимодействие с DOM

const feedback = document.querySelector('.feedback');

const render = (state) => {
  feedback.textContent = state.errors;
  if (state.isValid === true) {
    urlInput.classList.remove('is-invalid');
  } else {
    urlInput.classList.add('is-invalid');
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

  //TODO добавить атрибуты в теги
  //TODO добавить идентификаторы для выборки + нормализация данных
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
      const button = document.createElement('button');
      button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      button.textContent = 'Просмотр';
      li.appendChild(a);
      li.appendChild(button);
      ul.appendChild(li);
    })

    divCard.appendChild(divCardBody);
    divCard.appendChild(ul);
    divPosts.appendChild(divCard);
  }
}
