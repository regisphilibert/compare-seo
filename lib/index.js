import Gauge from 'gauge';
import { getPages, getSEOMetas, getRelURL } from './utils.js';

/**
 * 
 * @param {*} pages A list of URLs as object {base: 'https://test.com/contact, against: https://test.staging/contact}
 * @param {*} params Object
 * @returns 
 */
export default async function(pages = [], params = {} ) {
  const { metas = [], excludes = [], gauge = false } = params
  const _gauge = new Gauge()
  let outputs = []
  if(pages.length) {
    for (const page of pages) {
      if(gauge) {
        const index = pages.indexOf(page)
        let progress = index ? (index / pages.length) : 0
        _gauge.pulse(); _gauge.show(`working on ${getRelURL(page.base)}`, progress)
      }
      const comparison = await getPages(page.base, page.against)
      if(comparison.base.status == "ok" && comparison.against.status == "ok") {
        const baseSEO = getSEOMetas(comparison.base.doc, metas, excludes)
        const againstSEO = getSEOMetas(comparison.against.doc, metas, excludes)
        let logs = []
        baseSEO.forEach(meta => {
          const found = againstSEO.find(aMeta => aMeta.name == meta.name)
          if(!found){
            logs.push({
              name: meta.name,
              base: meta.value,
              against: `${meta.name} not found`,
              status: "meta not found",
            })
          } else {
            if(found.value !== meta.value) {
              logs.push({
                name: meta.name,
                base: meta.value,
                against: found.value,
                status: "diff"
              })
            }
          }
        })
        if(logs.length) {
          outputs.push({
            title: page.base,
            base: {
              url: comparison.base.url
            },
            against: {
              url: comparison.against.url
            },
            metas: logs
          })
        }
      } else {
        outputs.push({
          title: page.base,
          base: {
            url: comparison.base.url
          },
          against: {
            url: comparison.against.url
          },
          status: "page not found"
        })
      }
    }
  }
  if(outputs.length) {
    return {
      status: "problem",
      logs: outputs,
    }
  } else {
    return {
      status: "all good",
      logs,
    }
  }
}