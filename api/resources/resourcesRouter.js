const express = require('express');
const router = express.Router();
const Resources = require('./resourcesModel');
const authRequired = require('../middleware/authRequired');
const { adminRequired } = require('../middleware/permissionsRequired');
const {
  checkResourceIdExists,
  validateResource,
} = require('../middleware/resourcesMiddleware');

/**
 * @swagger
 * components:
 *  schemas:
 *    Resource:
 *      type: object
 *      required:
 *        - resource_name
 *        - category
 *        - condition
 *      properties:
 *        resource_id:
 *          type: integer
 *          description: Unique primary key referencing a resource's auto-assigned ID - must not be provided in request bodies
 *        created_at:
 *          type: timestamp
 *          description: Automatic date-time string from a resource's creation in the database - must not be provided in request bodies
 *        updated_at:
 *          type: timestamp
 *          description: Automatic date-time string from a resource's last update in the database - must not be provided in request bodies
 *        resource_name:
 *          type: string
 *          description: The name of a resource
 *        category:
 *          type: string
 *          description: The name of the category the resource belongs to
 *        condition:
 *          type: string
 *          description: An evaluation of the resource's current condition
 *        assigned:
 *          type: boolean
 *          description: State of whether or not a resource is assigned to someone already - defaults to false
 *        current_assignee:
 *          type: string
 *          description: Foreign key referencing the profile_id of the current assignee - defaults to null
 *        previous_assignee:
 *          type: string
 *          description: Foreign key referencing the profile_id of the previous assignee - defaults to null
 *        monetary_value:
 *          type: string
 *          description: The approximate price/value of the resource
 *        deductible_donation:
 *          type: boolean
 *          description: State of whether or not a resource is a deductible donation
 *      example:
 *        resource_id: 1
 *        created_at: "2021-11-12T19:50:44.914Z"
 *        updated_at: "2021-11-12T19:50:44.914Z"
 *        resource_name: "MacBook Pro 2020"
 *        category: "Computers"
 *        condition: "Excellent"
 *        assigned: true
 *        current_assignee: "9"
 *        previous_assignee: "7"
 *        monetary_value: "$1000"
 *        deductible_donation: true
 */

/**
 * @swagger
 * /resources:
 *  get:
 *    summary: Get the list of all resources
 *    description: Provides a JSON array of resources (as objects) currently available for/assigned to clients
 *    tags:
 *      - resource
 *    security:
 *      - auth0: []
 *    parameters:
 *      - in: query
 *        name: resource property
 *        schema:
 *          type: string
 *        description: A resource property key to query for - accepts partial matching
 *    responses:
 *      '200':
 *        description: An array of resource objects
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Resource'
 *              example:
 *                - resource_id: 54
 *                  created_at: "2022-01-13T20:54:47.222Z"
 *                  updated_at: "2022-01-13T20:54:47.222Z"
 *                  resource_name: 'Mead Composition Notebook'
 *                  category: 'Office Supplies'
 *                  condition: 'New'
 *                  assigned: false
 *                  current_assignee: null
 *                  previous_assignee: null
 *                  monetary_value: '$2'
 *                  deductible_donation: false
 *                - resource_id: 27
 *                  created_at: "2022-01-13T20:54:47.222Z"
 *                  updated_at: "2022-01-13T20:54:47.222Z"
 *                  resource_name: 'Lenovo Chromebook S330'
 *                  category: 'Computers'
 *                  condition: 'New'
 *                  assigned: true
 *                  current_assignee: '5'
 *                  previous_assignee: '4'
 *                  monetary_value: '$250'
 *                  deductible_donation: true
 *                - resource_id: 33
 *                  created_at: "2022-01-13T20:54:47.222Z"
 *                  updated_at: "2022-01-13T20:54:47.222Z"
 *                  resource_name: 'Sharpie Pens (Black), 12pcs'
 *                  category: 'Office Supplies'
 *                  condition: 'New'
 *                  assigned: false
 *                  current_assignee: null
 *                  previous_assignee: null
 *                  monetary_value: '$15'
 *                  deductible_donation: true
 *      '401':
 *        $ref: '#/components/responses/UnauthorizedError'
 */

router.get('/', authRequired, async (req, res, next) => {
  try {
    const filters = req.query;
    const allResources = await Resources.findAll();

    if (!filters) {
      return res.status(200).json(allResources);
    }

    const filteredResources = allResources.filter((resource) => {
      let resourceIsValid = true;
      for (let key in filters) {
        resourceIsValid =
          resourceIsValid &&
          (resource[key] === filters[key] ||
            resource[key].toLowerCase().includes(filters[key].toLowerCase()));
      }
      return resourceIsValid;
    });

    return res.status(200).json(filteredResources);
  } catch (err) {
    next({ status: 500, message: err.message });
  }
});

/**
 * @swagger
 * /resources/{resource_id}:
 *  get:
 *    summary: Get details about a single resource
 *    tags:
 *      - resource
 *    security:
 *      - auth0: []
 *    parameters:
 *      - in: path
 *        name: resource_id
 *        schema:
 *          type: integer
 *        required: true
 *        description: Numeric ID of the resource to look for
 *    responses:
 *      '200':
 *        description: Information about a specific resource
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Resource'
 *      '401':
 *        $ref: '#/components/responses/UnauthorizedError'
 *      '404':
 *        description: Resource with the given ID could not be found
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  description: Error message returned by the API
 *                  example: 'Resource with ID 1 not found!'
 */

router.get(
  '/:resource_id',
  authRequired,
  checkResourceIdExists,
  (req, res, next) => {
    try {
      const resource = req._resource;
      return res.status(200).json(resource);
    } catch (err) {
      next({ status: 500, message: err.message });
    }
  }
);

/**
 * @swagger
 * /resources:
 *  post:
 *    summary: Adds a new resource to the database
 *    description: Posts a new resource object to the resources table, if the resource is validly formatted. You only need to include resource_name, category, and condition in the request body, but other fields that adhere to the schema can be included if desired. Only data provided in the request body will be reflected in the response body.
 *    tags:
 *      - resource
 *    security:
 *      - auth0: []
 *    requestBody:
 *      description: Information about the resource to be posted
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Resource'
 *      required: true
 *    responses:
 *      '200':
 *        description: Response from successful post
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  description: Status of the request as a message
 *                  type: string
 *                resource:
 *                  description: Object mirroring the newly created resource -- will only display keys included in the request body upon posting, even if other keys are present/made in the database at creation
 *                  type: object
 *              example:
 *                message: 'success'
 *                resource:
 *                  resource_name: 'Composition Notebook'
 *                  category: 'Office Supplies'
 *                  condition: 'New'
 *      '401':
 *        $ref: '#/components/responses/UnauthorizedError'
 */

router.post(
  '/',
  authRequired,
  adminRequired,
  validateResource,
  async (req, res, next) => {
    try {
      const resourceInput = req._resource;
      const postResponse = await Resources.Create(resourceInput);
      return res.status(201).json({
        message: 'new resource created, successfully!',
        resource: postResponse,
      });
    } catch (err) {
      next({ status: 500, message: err.message });
    }
  }
);

/**
 * @swagger
 * /resources/{resource_id}:
 *  put:
 *    summary: Updates resource details
 *    description: Allows you to edit information about a resource. Requires resource_name, category, and condition fields. Only information included in the request body will be altered about the resource in question (i.e. empty fields will be ignored). If the ID provided by the resource_id URL parameter is invalid, the request will time out (this needs to be addressed in the future).
 *    tags:
 *      - resource
 *    security:
 *      - auth0: []
 *    parameters:
 *      - in: path
 *        name: resource_id
 *        schema:
 *          type: integer
 *        required: true
 *        description: Numeric ID of the resource to edit
 *    requestBody:
 *      description: Information to update about the desired resource
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Resource'
 *      required: true
 *    responses:
 *      '200':
 *        description: Response from a successful resource update
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  description: Success message, including the ID of the updated resource
 *                success:
 *                  type: object
 *                  description: Object containing all information pertaining to the newly updated resource
 *              example:
 *                message: "Resource #108 updated, successfully!"
 *                resource:
 *                  resource_id: 108
 *                  created_at: "2022-01-18T22:00:08.001Z"
 *                  updated_at: "2022-02-18T22:00:09.001Z"
 *                  resource_name: "Logitech HD Webcam C310"
 *                  category: "Electronics"
 *                  condition: "Acceptable"
 *                  assigned: false
 *                  current_assignee: null
 *                  previous_assignee: '12'
 *                  monetary_value: $35
 *                  deductible_donation: true
 *      '401':
 *        $ref: '#/components/responses/UnauthorizedError'
 *      '404':
 *        description: Resource with the given ID could not be found
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  description: Error message returned by the API
 *                  example: 'Resource with ID 1 not found!'
 */

router.put(
  '/:resource_id',
  authRequired,
  adminRequired,
  checkResourceIdExists,
  validateResource,
  async (req, res, next) => {
    try {
      const { resource_id } = req.params;
      const resourceInput = req._resource;
      const updatedResource = await Resources.Update(
        resource_id,
        resourceInput
      );
      return res.status(200).json({
        message: `Resource #${resource_id} updated, successfully!`,
        resource: updatedResource,
      });
    } catch (err) {
      next({ status: 500, message: err.message });
    }
  }
);

/**
 * @swagger
 * /resources/{resource_id}:
 *  delete:
 *    summary: Deletes a resource from the database
 *    description: If a resource with the ID provided as a URL parameter for this request exists, it will be deleted from the database.
 *    tags:
 *      - resource
 *    security:
 *      - auth0: []
 *    parameters:
 *      - in: path
 *        name: resource_id
 *        schema:
 *          type: integer
 *        required: true
 *        description: Numeric ID of the resource to delete
 *    responses:
 *      '200':
 *        description: Successful deletion of a resource
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  description: Message relaying a resource's successful deletion
 *              example:
 *                message: 'Resource #1 deleted, successfully!'
 *      '401':
 *        $ref: '#/components/responses/UnauthorizedError'
 *      '404':
 *        description: Resource with the given ID could not be found
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  description: Error message returned by the API
 *                  example: 'Resource with ID 1 not found!'
 */

router.delete(
  '/:resource_id',
  authRequired,
  adminRequired,
  checkResourceIdExists,
  async (req, res, next) => {
    try {
      const { resource_id } = req.params;
      await Resources.Delete(resource_id);
      return res.status(200).json({
        message: `Resource #${resource_id} deleted, successfully!`,
      });
    } catch (err) {
      next({ status: 500, message: err.message });
    }
  }
);

module.exports = router;
