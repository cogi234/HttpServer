export default class Controller {
    constructor(HttpContext, repository = null) {
        this.HttpContext = HttpContext;
        this.repository = repository;
    }

    head() {
        if (this.repository != null)
            this.HttpContext.response.ETag(this.repository.ETag);
        else
            this.HttpContext.response.notImplemented();
    }

    get(id) {
        if (this.repository == null) {
            this.HttpContext.response.notImplemented();
            return;
        }
        if (id === undefined) {
            let data = this.repository.getAll(this.HttpContext.path.params);

            if (this.repository.isValid())
                this.HttpContext.response.JSON(data, this.repository.ETag);
            else
                this.HttpContext.response.badRequest(this.repository.errorMessages);
            return;
        }
        if (isNaN(id)) {
            this.HttpContext.response.badRequest('The id in the request url is malformed or syntactically wrong.');
            return;
        }

        let data = this.repository.get(id);
        if (data)
            this.HttpContext.response.JSON(data);
        else
            this.HttpContext.response.notFound('Resource not found.');
    }

    post(data) {
        data = this.repository.add(data);

        if (this.repository.model.state.isValid) {
            this.HttpContext.response.created(data);
            return;
        }
        //Invalid model
        if (this.repository.model.state.inConflict) {
            this.HttpContext.response.conflict(this.repository.model.state.errors);
            return;
        }
        this.HttpContext.response.badRequest(this.repository.model.state.errors);
    }

    put(data) {
        if (isNaN(this.HttpContext.path.id)) {
            this.HttpContext.response.badRequest('The id of the resource is not specified or malformed in the request url.');
            return;
        }

        this.repository.update(this.HttpContext.path.id, data);

        if (this.repository.model.state.isValid) {
            this.HttpContext.response.ok();
            return;
        }
        //Invalid model
        if (this.repository.model.state.notFound) {
            this.HttpContext.response.notFound(this.repository.model.state.errors);
            return;
        }
        if (this.repository.model.state.inConflict) {
            this.HttpContext.response.conflict(this.repository.model.state.errors);
            return;
        }
        this.HttpContext.response.badRequest(this.repository.model.state.errors);
    }

    remove(id) {
        if (isNaN(id)) {
            this.HttpContext.response.badRequest('The id of the resource is not specified or malformed in the request url.');
            return;
        }
        //We try to remove
        if (this.repository.remove(id)) {
            this.HttpContext.response.accepted();
            return;
        }
        //we failed to remove
        this.HttpContext.response.notFound("Resource not found.");
    }
}