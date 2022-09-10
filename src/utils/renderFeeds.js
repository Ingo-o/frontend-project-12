import i18next from 'i18next';

export default (feedsState) => {
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
    });
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
        a.classList.add('link-secondary');
      }
      if (!post.isViewed) {
        a.classList.remove('fw-normal');
        a.classList.remove('link-secondary');
        a.classList.add('fw-bold');
      }

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
      // button.addEventListener('click', showModal);
      li.appendChild(a);
      li.appendChild(button);
      ul.appendChild(li);
    });

    divCard.appendChild(divCardBody);
    divCard.appendChild(ul);
    divPosts.appendChild(divCard);
  }
};
