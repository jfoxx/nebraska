import { createOptimizedPicture } from '../../scripts/aem.js';

function flipCard() {
  const parentLi = this.parentElement;
  if (parentLi.classList.contains('flipped')) {
    parentLi.classList.remove('flipped');
  } else {
    parentLi.classList.add('flipped');
  }
}

function cardListener() {
  const cards = document.querySelectorAll('.cards-card-image, .cards-card-body');
  cards.forEach((i) => {
    i.addEventListener('click', flipCard);
  });
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
  cardListener();
}
