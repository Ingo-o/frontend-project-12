export default (state, feedsState) => {
  const feedback = document.querySelector('.feedback');
  const sendButton = document.querySelector('form button');
  const urlInput = document.querySelector('#url-input');
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
    // eslint-disable-next-line no-param-reassign
    state.success = '';
  }
  if (state.modal.isModalActive) {
    const modal = document.querySelector('.modal');
    modal.classList.add('show');
    modal.setAttribute('style', 'display: block;');
    modal.setAttribute('aria-modal', 'true');
    modal.removeAttribute('aria-hidden');
    const modalTitle = document.querySelector('.modal-title');
    const post = feedsState.posts.filter((item) => item.postID === +state.modal.postID)[0];
    modalTitle.textContent = post.title;
    const modalBody = document.querySelector('.modal-body');
    modalBody.textContent = post.description;
    const readButton = document.querySelector('.modal-footer a');
    readButton.href = post.link;
  }
  if (!state.modal.isModalActive) {
    const modal = document.querySelector('.modal');
    modal.classList.remove('show');
    modal.removeAttribute('style');
    modal.removeAttribute('aria-modal');
    modal.setAttribute('aria-hidden', 'true');
  }
  if (state.isActive) {
    urlInput.removeAttribute('readonly');
    sendButton.removeAttribute('disabled');
  }
  if (!state.isActive) {
    urlInput.setAttribute('readonly', '');
    sendButton.setAttribute('disabled', '');
  }
};
