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
