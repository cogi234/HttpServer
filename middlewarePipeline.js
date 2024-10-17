export default class MiddlewarePipeline {
    constructor() {
        this.middlewares = [];
    }

    add(middleware) {
        this.middlewares.push(middleware);
    }

    async handleHttpRequest(httpContext) {
        for (const middleware of this.middlewares) {
            if (await middleware(httpContext))
                return true;
        }
        return false;
    }
}