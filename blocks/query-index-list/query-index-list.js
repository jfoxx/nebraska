import ffetch from '../../scripts/ffetch.js';

const allentries = await ffetch('/query-index.json').all();
function filterItems(arr, query) {
  return arr.filter((el) => el.path.includes(query));
}

/* eslint-disable prefer-const */

function formatDate(date) {
  const mydate = date.split(' ')[0];
  let year;
  let month;
  let day;
  [year, month, day] = mydate.split('-');
  const dateline = `${month}/${day}/${year}`;
  return dateline;
}
export default function decorate(block) {
  const base = block.firstElementChild;
  const title = base.firstElementChild.innerText;
  const folder = base.lastElementChild.innerText;
  const heading = document.createElement('h3');
  heading.innerText = title;
  const list = document.createElement('ul');
  const match = filterItems(allentries, folder);
  match.forEach((i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = i.path;
    a.innerText = i.title;
    const datespan = document.createElement('span');
    datespan.className = 'datespan';
    datespan.innerText = formatDate(i['article-date']);
    li.append(datespan, ' - ', a);
    list.append(li);
  });
  block.textContent = '';
  block.append(heading, list);
}
