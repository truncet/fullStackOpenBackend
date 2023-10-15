const lodash = require('lodash')

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => blogs.reduce((total, blog) => total + blog.likes, 0)

const favoriteBlog = (blogs) => {
    let maxLikes = -1;
    let mostLikedBlog = {};
  
    for (const blog of blogs) {
      if (blog.likes > maxLikes) {
        maxLikes = blog.likes;
        mostLikedBlog = blog;
      }
    }
  
    return mostLikedBlog;
}

const mostBlogs = (blogs) => {
    const authorCounts = lodash.groupBy(blogs, 'author');

    const topAuthor = lodash.maxBy(Object.keys(authorCounts), author => lodash.get(authorCounts[author], 'length', 0))
    return {
        author: topAuthor,
        blogs: lodash.get(authorCounts[topAuthor], 'length', 0)
    };
}

const mostLikes = (blogs) => {
    const authorLikes = lodash.groupBy(blogs, 'author');

    const topAuthor = lodash.maxBy(Object.keys(authorLikes), author =>
        lodash.sumBy(authorLikes[author], 'likes')
    );

    return {
        author: topAuthor,
        likes: lodash.sumBy(authorLikes[topAuthor], 'likes')
    };
};

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}