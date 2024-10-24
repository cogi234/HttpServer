global.registeredRoutes = [];

export default class Routes {
    /**
     * Register a route
     */
    static register(method, controllerName, actionName = 'index') {
        registeredRoutes.push({
            method,
            controllerName,
            actionName
        });
    }

    /**
     * Find a route that corresponds to the httpContext
     * @returns \{method, controllerName, actionName} | null if not found
     */
    static find(httpContext) {
        let path = httpContext.path;
        
        for (const route of registeredRoutes) {
            if (
                route.method.toLowerCase() == httpContext.req.method.toLowerCase()
                && path.model != undefined && path.model.toLowerCase() === route.controllerName.toLowerCase()
                && path.action != undefined && path.action.toLowerCase() === route.actionName.toLowerCase()
            ) {
                route.id = path.id;
                return route;
            }
        }

        return null;
    }
}