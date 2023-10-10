module.exports.register = function ( { config }) {
  this.on('beforePublish', ({ siteCatalog, contentCatalog, playbook}) => {
    // filter page to have blogentry
    const pages = contentCatalog.getPages(({ asciidoc, out }) => {
      if (! out || ! asciidoc)
        return
      const pageTags = asciidoc.attributes['page-tags']
      const rvalue = pageTags && pageTags.split(', ').includes('blogentry')
      return rvalue
    })
    const { buildPageUiModel } = require.main.require('@antora/page-composer/build-ui-model')
    // put every information on page
    const blogpages = pages.map((page) => buildPageUiModel(siteCatalog, page, contentCatalog)).sort(sortByDate)
    // bulild xml as string
    var feed = '<?xml version="1.0" encoding="UTF-8"?>'
    feed += '\n<feed xmlns="http://www.w3.org/2005/Atom">'
    feed += '\n  <title type="html">Apache NetBeans</title>'
    feed += '\n  <subtitle type="html">Quickly and easily develop web, mobile and desktop applications with Java, JavaScript, HTML5, PHP, C/C++ and more. </subtitle>'
    feed += '\n  <icon>https://netbeans.apache.org/favicon-32x32.png</icon>'
    feed += '\n  <id>https://netbeans.apache.org/blogs/atom</id>'
    feed += '\n  <link rel="self" type="application/atom+xml" href="https://netbeans.apache.org/blogs/atom" />'
    feed += '\n  <link rel="alternate" type="text/html" href="https://netbeans.apache.org/blogs/atom" />'
    blogpages.forEach((p) => {
      feed += '\n  <entry>'
      feed += '\n    <id>' + playbook.site.url + p.url + '</id>'
      feed += '\n    <title type="html">' + escape(p.title.toString()) + '</title>'
      feed += '\n    <author><name>' + p.author + '</name></author>'
      feed += '\n    <link rel="alternate" type="text/html" href="' + playbook.site.url + p.url + '"/>'
      feed += '\n    <published>' + rssDate(p.attributes.revdate) + '</published>'
      feed += '\n    <updated>' + rssDate(p.attributes.revdate) + '</updated>'
      feed += '\n    <content type="html">' + escape(blogcontent(p.contents.toString())) + '</content>'
      feed += '\n  </entry>'
    })
    feed += '\n  </feed>'
    // transfer to file in folder hierarchy
    const contents = Buffer.from(feed)
    siteCatalog.addFile({ contents, out: { path: 'front/main/blogs/atom.txt' } })
  })
}

// get a rss date from date
function rssDate (d) {
  const date = new Date(d)
  const month = date.getMonth() + 1
  const monthd = (month < 10 ? '0' : '') + month
  const dayinmonth = (date.getDate() < 10 ? '0' : '') + date.getDate()
  //we need this kind of format 2023-09-01T00:00:00Z
  return date.getFullYear() + '-' + monthd + '-' + dayinmonth + 'T00:00:00Z'
}

// sorter by date
function sortByDate (a, b) {
  return new Date(b.attributes.revdate) - new Date(a.attributes.revdate)
}
// reduce the page content to approx content, 
function blogcontent (s) {
  const endof = s.indexOf("<section class='tools'>")
  const startof = s.indexOf('<div class="paragraph">')
  const split = s.substring(startof, endof)
  return split
}
// remove some breaking char for xml 
function escape (s) {
  s = s.replaceAll('&', '&amp;')
  s = s.replaceAll('>', '&gt;')
  s = s.replaceAll('<', '&lt;')
  s = s.replaceAll('"', '&quot;')
  s = s.replaceAll("'", '&apos;')
  return s
}