export default class Controller {
    constructor(HttpContext, repository = null) {
        this.HttpContext = HttpContext;
        this.repository = repository;
    }

    head() {
        if (this.repository != null)
            return this.HttpContext.response.ETag(this.repository.ETag);
        else
            return this.HttpContext.response.notImplemented();
    }

    get(id) {
        if (this.repository == null)
            return this.HttpContext.response.notImplemented();

        if (id === '') {
            let data = this.repository.getAll(this.HttpContext.path.params);

            if (this.repository.isValid())
                return this.HttpContext.response.JSON(data, this.repository.ETag);
            else
                return this.HttpContext.response.badRequest(this.repository.errorMessages);
        }

        let data = this.repository.get(id);
        if (data)
            return this.HttpContext.response.JSON(data);
        else
            return this.HttpContext.response.notFound('Resource not found.');
    }

    post(data) {
        data = this.repository.add(data);

        if (this.repository.model.state.isValid) {
            return this.HttpContext.response.created(data);
        }

        //Invalid model
        if (this.repository.model.state.inConflict)
            return this.HttpContext.response.conflict(this.repository.model.state.errors);

        return this.HttpContext.response.badRequest(this.repository.model.state.errors);
    }

    put(data) {
        if (this.HttpContext.path.id == '') {
            return this.HttpContext.response.badRequest('The id of the resource is not specified or malformed in the request url.');
        }

        this.repository.update(this.HttpContext.path.id, data);

        if (this.repository.model.state.isValid) {
            return this.HttpContext.response.ok();
        }

        //Invalid model
        if (this.repository.model.state.notFound)
            return this.HttpContext.response.notFound(this.repository.model.state.errors);

        if (this.repository.model.state.inConflict)
            return this.HttpContext.response.conflict(this.repository.model.state.errors);

        this.HttpContext.response.badRequest(this.repository.model.state.errors);
    }

    remove(id) {
        if (id === '')
            return this.HttpContext.response.badRequest('The id of the resource is not specified or malformed in the request url.');

        //We try to remove
        if (this.repository.remove(id)) {
            return this.HttpContext.response.deleted();
        }

        //we failed to remove
        return this.HttpContext.response.notFound("Resource not found.");
    }
}