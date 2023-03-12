import fetch from 'node-fetch'
import { parse } from 'node-html-parser';

export const fetchContent = async function(url) {
  return fetch(url, {
    headers: {
      'cache-control': 'no-cache'
    }
  })
    .then((response) => {
      if(response.status !== 404 ){
        return response.text()
      } else {
        return false
      }

    }).then(html => {
      if(html) {
        var doc = parse(html, 'text/html');
        return {
          status: "ok",
          url,
          doc,
        }
        
      } else {
        return {
          status: "missing"
        }
      }
    })
    .catch(function (err) {
      console.log("Unable to fetch -", err);
    });
}

export const getPages = async function(baseURL, againstURL) {
  const base = await fetchContent(baseURL)
  const against = await fetchContent(againstURL)
  return {
    base, 
    against
  }
}

export const findDiff = function(str1, str2){ 
  let diff= "";
  str2.split('').forEach(function(val, i){
    if (val != str1.charAt(i))
      diff += val ;         
  });
  return diff;
}

export const getRelURL = (abs) => {
  return abs.replace(/^(?:\/\/|[^/]+)*\//, '/')
}

const sortByName = (a, b) => {
  const nameA = a.name.toUpperCase(); // ignore upper and lowercase
  const nameB = b.name.toUpperCase(); // ignore upper and lowercase
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }

  // names must be equal
  return 0;
}

const getSEOMetaNames = () => {
  return [
    'robots',
    'og:title',
    'og:type',
    'og:image',
    'og:image:url',
    'og:image:alt',
    'og:url',
    'og:locale',
    'description',
    'og:title',
    'twitter:card',
    'twitter:creator',
    'twitter:site'
  ]
}

export const getSEOMetas = (doc, meta_names_user = [], excludes = []) => {
  const meta_names = meta_names_user.length ? meta_names_user : getSEOMetaNames()
  let selector = []
  meta_names.forEach(element => {
    selector.push(`[name*='${element}'],[property*='${element}']`)
  });
  selector = selector.join(',')
  //selector = 'meta[name],meta[property]'
  const doc_metas = doc.querySelectorAll(selector)
  let metas = [...doc_metas].map(meta => {
    const name = meta.getAttribute('name') ? meta.getAttribute('name') : meta.getAttribute('property')
    let value = meta.getAttribute('content')
    if(['og:image', 'og:url'].includes(name)) {
      // For some tags, we turn the absolute url value into relative for compare work
      value = getRelURL(value)
    }
    return {
      name,
      value
    }
  })
  if(excludes.length) {
    metas = metas.filter(meta => (!excludes.includes(meta.name)))
  }
  return metas.sort(sortByName)
}