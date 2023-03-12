import { getRelURL } from "./utils.js";
import Emoji from 'node-emoji'

import Table from 'cli-table'
import chalk from 'chalk';

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

const getSEOMetas = (doc, excludes = []) => {
  const meta_names = [
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

export default async function(compare) {
  const baseSEO = getSEOMetas(compare.base.doc, ['robots'])
  const againstSEO = getSEOMetas(compare.against.doc, ['robots'])
  let logs = []
  baseSEO.forEach(meta => {
    const found = againstSEO.find(aMeta => aMeta.name == meta.name)
    if(!found){
      logs.push({
        name: meta.name,
        base: meta.value,
        against: "not found " + Emoji.get('shrug'),
        icon: Emoji.get('🔴')
      })
    } else {
      if(found.value !== meta.value) {
        logs.push({
          name: meta.name,
          base: meta.value,
          against: found.value,
          icon: Emoji.get('🟠')
        })
      }
    }
  })
  let tables = []
  if(logs.length) {
    const heads = ['', compare.base.url, compare.against.url, '']
    const report = new Table({
      head: heads,
      colWidths: [20, 60, 60, 5]
    })
    logs.forEach(log => {
      let row = {}
      // For vertical table:
      row[log.name] = [log.base, log.against, log.icon]
      report.push(row)
    })
    tables.push({
      type: "table",
      title: chalk.white.bold(getRelURL(compare.base.url)),
      table: report
    })
  }
  return tables
}