import Service from '@ember/service';
import { readOnly } from '@ember/object/computed';
import { shallowEqual, resemblesURL, extractRouteArgs } from '../utils';

/**
   The Router service is the public API that provides component/view layer
   access to the router.

   @public
   @class RouterService
   @category ember-routing-router-service
 */
const RouterService = Service.extend({
  /**
     Name of the current route.

     This property represent the logical name of the route,
     which is comma separated.
     For the following router:

     ```app/router.js
     Router.map(function() {
       this.route('about');
       this.route('blog', function () {
         this.route('post', { path: ':post_id' });
       });
     });
     ```

     It will return:

     * `index` when you visit `/`
     * `about` when you visit `/about`
     * `blog.index` when you visit `/blog`
     * `blog.post` when you visit `/blog/some-post-id`

     @property currentRouteName
     @type String
     @public
   */
  currentRouteName: readOnly('_router.currentRouteName'),

  /**
     Current URL for the application.

    This property represent the URL path for this route.
    For the following router:

     ```app/router.js
     Router.map(function() {
       this.route('about');
       this.route('blog', function () {
         this.route('post', { path: ':post_id' });
       });
     });
     ```

     It will return:

     * `/` when you visit `/`
     * `/about` when you visit `/about`
     * `/blog` when you visit `/blog`
     * `/blog/some-post-id` when you visit `/blog/some-post-id`

     @property currentURL
     @type String
     @public
   */
  currentURL: readOnly('_router.currentURL'),

  /**
    The `location` property determines the type of URL's that your
    application will use.
    The following location types are currently available:
    * `auto`
    * `hash`
    * `history`
    * `none`

    @property location
    @default 'hash'
    @see {Location}
    @public
  */
  location: readOnly('_router.location'),

  /**
    The `rootURL` property represents the URL of the root of
    the application, '/' by default.
    This prefix is assumed on all routes defined on this app.

    IF you change the `rootURL` in your environment configuration
    like so:

    ```config/environment.js
    'use strict';

    module.exports = function(environment) {
      let ENV = {
        modulePrefix: 'router-service',
        environment,
        rootURL: '/my-root',
      …
      }
    ]
    ```

    This property will return `/my-root`.

    @property rootURL
    @default '/'
    @public
  */
  rootURL: readOnly('_router.rootURL'),
  _router: null,

  /**
     Transition the application into another route. The route may
     be either a single route or route path:

     See [transitionTo](/api/ember/release/classes/Route/methods/transitionTo?anchor=transitionTo) for more info.

     @method transitionTo
     @category ember-routing-router-service
     @param {String} routeNameOrUrl the name of the route or a URL
     @param {...Object} models the model(s) or identifier(s) to be used while
       transitioning to the route.
     @param {Object} [options] optional hash with a queryParams property
       containing a mapping of query parameters
     @return {Transition} the transition object associated with this
       attempted transition
     @public
   */
  transitionTo(...args) {
    if (resemblesURL(args[0])) {
      return this._router._doURLTransition('transitionTo', args[0]);
    }

    let { routeName, models, queryParams } = extractRouteArgs(args);

    let transition = this._router._doTransition(routeName, models, queryParams, true);
    transition._keepDefaultQueryParamValues = true;

    return transition;
  },

  /**
     Transition into another route while replacing the current URL, if possible.
     The route may be either a single route or route path:

     See [replaceWith](/api/ember/release/classes/Route/methods/replaceWith?anchor=replaceWith) for more info.

     @method replaceWith
     @category ember-routing-router-service
     @param {String} routeNameOrUrl the name of the route or a URL
     @param {...Object} models the model(s) or identifier(s) to be used while
       transitioning to the route.
     @param {Object} [options] optional hash with a queryParams property
       containing a mapping of query parameters
     @return {Transition} the transition object associated with this
       attempted transition
     @public
   */
  replaceWith(/* routeNameOrUrl, ...models, options */) {
    return this.transitionTo(...arguments).method('replace');
  },

  /**
     The `urlFor` helper method generates a URL based on the supplied route name.

    For an application that maps its routes as follows via the Router:

    ```app/router.js
    Router.map(function() {
      this.route('index', { path: '/' });
    });
    ```

    The RouterService's `urlFor` method will return the correct path to
    the `index` route as:

    ```js
     routerService.urlFor('index', { queryParams: { page: 0 }}); // => '/'
    ```

     An object containing a queryParams property can be passed to retrieve the
     corresponding url with parameters attached:

     ```js
      routerService.urlFor('index', { queryParams: { page: 0 }}); // => '/?page=0'
     ```

     Please note that when passing the queryParams hash to the `urlFor` helper,
     existing default values for these parameters that are already existent on
     a particular controller instance are ignored. If in this example the `index` controller
     had a default value for the page query parameter defined as follows:

     ```app/controllers/index.js
     export default Controller.extend({
       queryParams: ['page'],
       page: 0,
     });
     ```

     The `urlFor` helper will always return the url with the queryParams that were passed
     to it during invocation attached regardless
     if this particular queryParam is preset on the controller or not (in this case `/?page=0`).
     This differs from the behaviour of the similar `generateURL` helper of the private
     `-routing` service and has been changed for performance improvements.
     You can read more about it in the [RouterService RFC](https://github.com/emberjs/rfcs/blob/master/text/0095-router-service.md#query-parameter-semantics).

     If you would like the `urlFor` method to return an url without any query parameters
     attacheds, you can explicitly unset queryParams by either

     - passing no queryParams hash:
     ```js
       routerService.urlFor('index')
     ```
     - passing the `Ember.DEFAULT_VALUE` symbol as a value for the respective queryParam:
    ```js
      routerService.urlFor('index', { queryParams: { page: Ember.DEFAULT_VALUE }}); // => '/'
    ```

     @method urlFor
     @category ember-routing-router-service
     @param {String} routeName the name of the route
     @param {...Object} models the model(s) or identifier(s) to be used while
       transitioning to the route.
     @param {Object} [options] optional hash with a queryParams property
       containing a mapping of query parameters
     @return {String} the string representing the generated URL
     @public
   */
  urlFor(/* routeName, ...models, options */) {
    return this._router.generate(...arguments);
  },

  /**
     Determines whether a route is active.

     @method isActive
     @category ember-routing-router-service
     @param {String} routeName the name of the route
     @param {...Object} models the model(s) or identifier(s) to be used while
       transitioning to the route.
     @param {Object} [options] optional hash with a queryParams property
       containing a mapping of query parameters
     @return {boolean} true if the provided routeName/models/queryParams are active
     @public
   */
  isActive(...args) {
    let { routeName, models, queryParams } = extractRouteArgs(args);
    let routerMicrolib = this._router._routerMicrolib;

    if (!routerMicrolib.isActiveIntent(routeName, models, null)) {
      return false;
    }
    let hasQueryParams = Object.keys(queryParams).length > 0;

    if (hasQueryParams) {
      this._router._prepareQueryParams(
        routeName,
        models,
        queryParams,
        true /* fromRouterService */
      );
      return shallowEqual(queryParams, routerMicrolib.state.queryParams);
    }

    return true;
  },
});

export default RouterService;
