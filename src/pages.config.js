import Landing from './pages/Landing';
import CardOfDay from './pages/CardOfDay';
import Encyclopedia from './pages/Encyclopedia';
import CardDetail from './pages/CardDetail';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';


export const PAGES = {
    "Landing": Landing,
    "CardOfDay": CardOfDay,
    "Encyclopedia": Encyclopedia,
    "CardDetail": CardDetail,
    "Blog": Blog,
    "BlogPost": BlogPost,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
};