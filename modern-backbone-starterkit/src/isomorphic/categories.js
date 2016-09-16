/*
 * Decided to make two attributes: "urlSlug" and "otherSlug" to decouple urls so that we could easily change URLs
 * in the future if desired. otherSlug is used as the value of the category attribute in the article collection of the
 * database. otherSlug is also used as the <select>
 */
  const categories = [
    {
      otherSlug: 'politics',
      prettyName: "Politics",
      urlSlug: 'politics'
    },
    {
      otherSlug: 'spirituality',
      prettyName: "Spirituality",
      urlSlug: 'spirituality'
    },
    {
      otherSlug: 'entertainment',
      prettyName: "Entertainment",
      urlSlug: 'entertainment'
    },
    {
      otherSlug: 'sports',
      prettyName: "Sports",
      urlSlug: 'sports'
    },
    {
      otherSlug: 'business',
      prettyName: "Business",
      urlSlug: 'business'
    },
    {
      otherSlug: 'sci-tech',
      prettyName: "Science & Technology",
      urlSlug: 'science-and-technology'
    },
    {
      otherSlug: 'other',
      prettyName: "Other",
      urlSlug: 'other'
    },
  ];

  const otherSlugToPrettyName = {
    'politics': 'Politics',
    'spirituality': 'Spirituality',
    'entertainment': 'Entertainment',
    'sports': 'Sports',
    'business': 'Business',
    'sci-tech': 'Science & Technology',
    'other': 'Other'
  };

  const otherSlugToURLSlug = {
    'politics': 'politics',
    'spirituality': 'spirituality',
    'entertainment': 'entertainment',
    'sports': 'sports',
    'business': 'business',
    'sci-tech': 'science-and-technology',
    'other': 'other'
  };

module.exports = {
  categories: categories,
  otherSlugToPrettyName: otherSlugToPrettyName,
  otherSlugToURLSlug: otherSlugToURLSlug
};
