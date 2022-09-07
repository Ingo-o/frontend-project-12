// Import our custom CSS
import './scss/styles.scss';
// Import all of Bootstrap's JS
//import * as bootstrap from 'bootstrap';
import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import resources from './locales/index.js';

// Model
// Состояние, данные и логика приложения

const state = {
  inputValue: '',
  isValid: true,
  isActive: true,
  errors: '',
  lng: 'ru',
}

const watchedObject = onChange(state, (path, value, previousValue) => {
  console.log(state)
  render(state);
});

i18next.init({
  lng: 'ru',
  debug: true,
  resources: resources,
});

const schema = yup.object().shape({
  inputValue: yup.string().required(i18next.t('blankField')).url(i18next.t('incorrectUrl')),
});

const onFulfilled = (result) => {
  watchedObject.errors = '';
  watchedObject.isValid = true;
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
