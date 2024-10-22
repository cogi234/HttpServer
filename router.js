export async function apiEndpoint(httpContext) {
    return new Promise(async resolve => {
        if (!httpContext.path.isAPI)
            return false;

        let controllerName = httpContext.path.controllerName;
        if (controllerName != undefined) {
            try {
                //Try to dynamically import the controller
                const { default: Controller } = (await import('./controllers/' + controllerName + '.js'));

                let controller = new Controller(httpContext);
                switch (httpContext.req.method) {
                    case 'HEAD':
                        controller.head(httpContext.path.id);
                        resolve(true);
                        break;
                    case 'GET':
                        controller.get(httpContext.path.id);
                        resolve(true);
                        break;
                    case 'POST':
                        if (httpContext.payload)
                            controller.post(httpContext.payload);
                        else
                            httpContext.response.unsupported();
                        resolve(true);
                        break;
                    case 'PUT':
                        if (httpContext.payload)
                            controller.put(httpContext.payload);
                        else
                            httpContext.response.unsupported();
                        resolve(true);
                        break;
                    case 'DELETE':
                        controller.remove(httpContext.path.id);
                        resolve(true);
                        break;
                    default:
                        httpContext.response.notImplemented();
                        resolve(true);
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