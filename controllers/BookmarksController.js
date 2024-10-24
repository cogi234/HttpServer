import Bookmark from '../models/bookmark.js';
import Repository from '../models/repository.js';
import Controller from './Controller.js';

export default class BookmarksController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new Bookmark()));
    }

    list() {
        return this.HttpContext.response.JSON(this.repository.getAll(this.HttpContext.path.params), this.repository.ETag);
    }
}