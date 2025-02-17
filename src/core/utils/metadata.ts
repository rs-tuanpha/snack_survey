// import ogs from 'open-graph-scraper-lite'
// import { getLinkPreview } from 'link-preview-js'
export interface Metadata {
  title: string
  description: string
  image: string
}

export const fetchOpenGraphMetadata = async (url: string): Promise<Metadata | null> => {
  try {
    

    const apiKey = process.env.VUE_APP_LINKPREVIEW_KEY ?? ''
    const response = await fetch(`https://api.linkpreview.net/?key=${apiKey}&q=${url}`)
    const data = await response.json()

    return {
      title: data.title,
      description: data.description,
      image: data.image || ''
    }
  } catch (error) {
    console.error('Error fetching OpenGraph metadata:', error)
    return null
  }
}

export const fetchDOMMetadata = async (url: string): Promise<Metadata | null> => {
  try {
    const response = await fetch(url)
    const html = await response.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')

    const getMetaContent = (property: string) =>
      doc.querySelector(`meta[property='${property}']`)?.getAttribute('content') ?? ''

    return {
      title: getMetaContent('og:title') ?? doc.title,
      description: getMetaContent('og:description'),
      image: getMetaContent('og:image')
    }
  } catch (error) {
    console.error('Error fetching DOM metadata:', error)
    return null
  }
}

export const fetchNoembedMetaData = async (url: string) => {
  try {
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
    const data = await response.json()
    console.log('TEST fetchNoembedMetaData', data)
    return {
      title: data.title ?? '',
      description: data.description ?? '',
      image: data.image ?? ''
    }
  } catch (error) {
    console.error('Error fetching OpenGraph metadata:', error)
    return null
  }
}
