import Routes from "./routes.js";

export async function apiEndpoint(httpContext) {
    return new Promise(async resolve => {
        if (!httpContext.path.isAPI) {
            resolve(false);
            return;
        }

        let controllerName = httpContext.path.controllerName;
        if (controllerName != undefined) {
            try {
                //Try to dynamically import the controller
                const { default: Controller } = (await import('./controllers/' + controllerName + '.js'));

                let controller = new Controller(httpContext);
                switch (httpContext.req.method) {
                    case 'HEAD':
                        resolve(controller.head(httpContext.path.id));
                        break;
                    case 'GET':
                        resolve(controller.get(httpContext.path.id));
                        break;
                    case 'POST':
                        if (httpContext.payload)
                            resolve(controller.post(httpContext.payload));
                        else
                            resolve(httpContext.response.unsupported());
                        break;
                    case 'PUT':
                        if (httpContext.payload)
                            resolve(controller.put(httpContext.payload));
                        else
                            resolve(httpContext.response.unsupported());
                        break;
                    case 'DELETE':
                        resolve(controller.remove(httpContext.path.id));
                        break;
                    default:
                        resolve(httpContext.response.notImplemented());
                        break;
                }
            } catch (error) {
                console.log('API endpoint Error message: \n', error.message);
                console.log('Stack: \n', error.stack);
                httpContext.response.notFound();
                resolve(true);
            }
        } else {
            resolve(false);
        }
    });
}

export async function registeredEndpoint(httpContext) {

    return new Promise(async resolve => {
        let route = Routes.find(httpContext);

        //If a route is found, we use it
        if (route) {
            try {
                //Try to dynamically import the controller
                const { default: Controller } = await import('./controllers/' + route.controllerName + 'Controller.js');

                let controller = new Controller(httpContext);

                if (route.method === 'POST' || route.method === 'PUT') {
                    if (httpContext.payload)
                        resolve(controller[route.actionName](httpContext));
                    else
                        resolve(httpContext.response.unsupported());
                } else
                    resolve(controller[route.actionName](httpContext));
            } catch (error) {
                console.log('registered endpoint Error message: \n', error.message);
                console.log('Stack: \n', error.stack);
                resolve(httpContext.response.notFound());
            }
        }

        resolve(false);
    });
}