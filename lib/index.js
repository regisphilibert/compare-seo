import { getPages, getSEOMetas } from './utils.js';


export default async function(pages = [], excludes = []) {
  let outputs = []
  if(pages.length) {
    for (const page of pages) {
      const comparison = await getPages(page.base, page.against)
      if(comparison.base.status == "ok" && comparison.against.status == "ok") {
        const baseSEO = getSEOMetas(comparison.base.doc, ['robots'])
        const againstSEO = getSEOMetas(comparison.against.doc, ['robots'])
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
            metas: logs
          })
        }
      } else {
        outputs.push({
          title: page.base,
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