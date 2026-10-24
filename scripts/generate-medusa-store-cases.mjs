import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve("test-cases/medusa/store-api");
const apiVersion = "2.21.2";
const sourceSpec =
  "https://raw.githubusercontent.com/medusajs/medusa/6ac9524c/www/apps/api-reference/specs/store/openapi.full.yaml";

const operation = (key, title, method, route, options = {}) => ({
  key,
  title,
  method,
  route,
  customerAuth: false,
  preconditions: [],
  responseContract: options.responseContract ?? "JSON response matches the documented OpenAPI contract",
  ...options,
});

const domains = {
  products: {
    label: "Products",
    prefix: "MED-STORE-PRODUCTS",
    target: 80,
    operations: [
      operation("list-products", "List products", "GET", "/store/products", {
        responseContract: "StoreProductListResponse",
      }),
      operation("get-product", "Retrieve a product", "GET", "/store/products/{id}", {
        preconditions: ["A published product exists in the publishable key's sales channel"],
        responseContract: "StoreProductResponse",
      }),
    ],
    categories: [
      {
        name: "filters-search-pagination-sorting",
        quota: 22,
        variants: [
          variant("default pagination", "Omit limit and offset and verify documented defaults"),
          variant("first result", "Set limit=1 and offset=0"),
          variant("zero limit", "Set limit=0", [200, 400]),
          variant("negative limit", "Set limit=-1", [400, 422]),
          variant("non-integer limit", "Set limit=abc", [400, 422]),
          variant("large offset", "Set offset beyond the available catalog"),
          variant("negative offset", "Set offset=-1", [400, 422]),
          variant("search by exact title", "Set q to an existing product title"),
          variant("search by partial title", "Set q to a partial product title"),
          variant("search with no matches", "Set q to a unique value that matches no product"),
          variant("ascending title order", "Request ascending title order"),
          variant("descending created date order", "Request descending created_at order"),
        ],
      },
      {
        name: "pricing-sales-channel",
        quota: 20,
        variants: [
          variant("region price context", "Request products with a valid region_id"),
          variant("currency price context", "Request products with a valid currency_code"),
          variant("conflicting price contexts", "Send both incompatible region and currency contexts", [400, 422]),
          variant("unknown region", "Send a syntactically valid but nonexistent region_id", [400, 404, 422]),
          variant("unsupported currency", "Request an unsupported currency code", [200, 400, 422]),
          variant("sales-channel visibility", "Verify only products associated with the key's sales channel are returned"),
          variant("unpublished product hidden", "Verify a draft product is not exposed"),
          variant("variant calculated price", "Verify variant calculated_price uses the selected context"),
          variant("tax-inclusive price", "Verify tax-inclusive pricing fields for a configured region"),
          variant("zero-price variant", "Retrieve a published variant with a zero amount"),
        ],
      },
      {
        name: "fields-relations-localization",
        quota: 12,
        variants: [
          variant("minimal field selection", "Request fields=id,title"),
          variant("variant relation expansion", "Request variants and calculated_price fields"),
          variant("category relation expansion", "Request categories.id and categories.name"),
          variant("unknown field", "Request a field not present in the contract", [400, 422]),
          variant("excluded field", "Exclude description using fields syntax"),
          variant("valid locale", "Send a configured locale and verify translated content"),
        ],
      },
      {
        name: "contracts-happy-paths",
        quota: 10,
        variants: [
          variant("successful response", "Send the minimum valid request"),
          variant("JSON content type", "Verify Content-Type is application/json"),
          variant("identifier format", "Verify returned product IDs use the product_ prefix"),
          variant("required properties", "Verify required product properties are present"),
          variant("stable list metadata", "Verify count, limit, and offset are internally consistent"),
        ],
      },
      {
        name: "invalid-ids-boundaries-key",
        quota: 10,
        variants: [
          missingPublishableKey(),
          invalidPublishableKey(),
          variant("nonexistent product ID", "Use product_ followed by a nonexistent identifier", 404),
          variant("malformed product ID", "Use an identifier with the wrong prefix", [400, 404]),
          variant("encoded injection payload", "Use a URL-encoded SQL/script payload as the product ID", [400, 404]),
        ],
      },
      {
        name: "consistency-performance",
        quota: 6,
        variants: [
          variant("list/detail consistency", "Compare the same product's core fields in list and detail responses"),
          variant("repeat-read stability", "Repeat an identical GET and verify stable business fields"),
          variant("concurrent reads", "Issue concurrent identical reads and verify successful equivalent contracts"),
        ],
      },
    ],
  },
  carts: {
    label: "Carts",
    prefix: "MED-STORE-CARTS",
    target: 150,
    operations: [
      operation("create-cart", "Create a cart", "POST", "/store/carts", {
        responseContract: "StoreCartResponse",
      }),
      operation("get-cart", "Retrieve a cart", "GET", "/store/carts/{id}", {
        preconditions: ["An active cart exists"],
        responseContract: "StoreCartResponse",
      }),
      operation("update-cart", "Update a cart", "POST", "/store/carts/{id}", {
        preconditions: ["An active cart exists"],
        responseContract: "StoreCartResponse",
      }),
      operation("complete-cart", "Complete a cart", "POST", "/store/carts/{id}/complete", {
        preconditions: ["A checkout-ready cart exists"],
        responseContract: "StoreCompleteCartResponse",
      }),
      operation("associate-customer", "Associate the authenticated customer", "POST", "/store/carts/{id}/customer", {
        customerAuth: true,
        preconditions: ["An active cart exists", "An authenticated customer exists"],
        responseContract: "StoreCartResponse",
      }),
      operation("add-gift-cards", "Add gift cards to a cart", "POST", "/store/carts/{id}/gift-cards", {
        preconditions: ["An active cart and valid gift card exist"],
        responseContract: "StoreCartResponse",
      }),
      operation("remove-gift-cards", "Remove gift cards from a cart", "DELETE", "/store/carts/{id}/gift-cards", {
        preconditions: ["An active cart has a gift card"],
        responseContract: "StoreCartResponse",
      }),
      operation("add-line-item", "Add a line item", "POST", "/store/carts/{id}/line-items", {
        preconditions: ["An active cart and published in-stock variant exist"],
        responseContract: "StoreCartResponse",
      }),
      operation("update-line-item", "Update a line item", "POST", "/store/carts/{id}/line-items/{line_id}", {
        preconditions: ["An active cart contains a line item"],
        responseContract: "StoreCartResponse",
      }),
      operation("delete-line-item", "Delete a line item", "DELETE", "/store/carts/{id}/line-items/{line_id}", {
        preconditions: ["An active cart contains a line item"],
        responseContract: "StoreCartResponse",
      }),
      operation("add-shipping-method", "Add a shipping method", "POST", "/store/carts/{id}/shipping-methods", {
        preconditions: ["An active cart has an address and eligible shipping option"],
        responseContract: "StoreCartResponse",
      }),
      operation("add-store-credit", "Add store credit", "POST", "/store/carts/{id}/store-credits", {
        preconditions: ["An active cart and eligible store credit exist"],
        responseContract: "StoreCartResponse",
      }),
      operation("refresh-taxes", "Refresh cart taxes", "POST", "/store/carts/{id}/taxes", {
        preconditions: ["An active cart has taxable items and an address"],
        responseContract: "StoreCartResponse",
      }),
    ],
    categories: [
      {
        name: "lifecycle-completion-state",
        quota: 30,
        variants: [
          variant("valid lifecycle state", "Execute the operation from its documented valid cart state"),
          variant("already completed cart", "Execute against an already completed cart", [400, 409, 422]),
          variant("deleted cart", "Execute against a deleted cart", 404),
          variant("nonexistent cart", "Use a syntactically valid nonexistent cart ID", 404),
          variant("malformed cart ID", "Use an identifier with the wrong prefix", [400, 404]),
          variant("replay after success", "Repeat the operation after a successful response", [200, 400, 409]),
        ],
      },
      {
        name: "line-items-quantity-inventory",
        quota: 30,
        operationKeys: ["add-line-item", "update-line-item", "delete-line-item", "get-cart"],
        variants: [
          variant("valid in-stock quantity", "Use an in-stock published variant and quantity=1"),
          variant("quantity zero", "Set quantity=0", [400, 422]),
          variant("negative quantity", "Set quantity=-1", [400, 422]),
          variant("fractional quantity", "Set quantity=1.5", [400, 422]),
          variant("quantity above inventory", "Request more units than available inventory", [400, 409, 422]),
          variant("draft variant", "Use a variant belonging to a draft product", [400, 404]),
          variant("unknown variant", "Use a syntactically valid nonexistent variant ID", [400, 404]),
          variant("line item from another cart", "Use a line-item ID owned by another cart", [400, 404]),
        ],
      },
      {
        name: "tax-shipping-gift-credit-totals",
        quota: 28,
        operationKeys: [
          "add-gift-cards",
          "remove-gift-cards",
          "add-shipping-method",
          "add-store-credit",
          "refresh-taxes",
          "get-cart",
        ],
        variants: [
          variant("totals recalculated", "Verify totals and subtotals are recalculated after the operation"),
          variant("ineligible resource", "Use a valid resource that is not eligible for this cart", [400, 422]),
          variant("expired resource", "Use an expired gift card, credit, or shipping option", [400, 404, 422]),
          variant("currency mismatch", "Use a resource denominated in another currency", [400, 422]),
          variant("tax-inclusive region", "Verify tax-inclusive totals in a configured region"),
          variant("rounding boundary", "Use prices that exercise currency rounding boundaries"),
          variant("duplicate application", "Apply the same resource twice", [200, 400, 409]),
        ],
      },
      {
        name: "region-address-customer",
        quota: 20,
        operationKeys: ["create-cart", "update-cart", "associate-customer", "get-cart"],
        variants: [
          variant("valid region", "Use a configured region ID"),
          variant("unknown region", "Use a syntactically valid nonexistent region ID", [400, 404]),
          variant("unsupported country", "Use a country not configured for the cart region", [400, 422]),
          variant("complete shipping address", "Provide all required shipping address fields"),
          variant("missing postal code", "Omit a required postal code", [400, 422]),
          variant("customer email normalization", "Use mixed-case email and verify normalized behavior"),
          missingCustomerAuth(),
        ],
      },
      {
        name: "validation-replay-concurrency-idempotency",
        quota: 22,
        variants: [
          variant("empty JSON body", "Send an empty JSON object", [200, 400, 422]),
          variant("null JSON body", "Send JSON null", [400, 422]),
          variant("malformed JSON", "Send malformed JSON with application/json", 400),
          variant("wrong property type", "Send a documented property using the wrong JSON type", [400, 422]),
          variant("unknown property", "Add an undocumented request property", [200, 400, 422]),
          variant("concurrent identical mutation", "Issue two identical mutations concurrently", [200, 400, 409]),
          variant("concurrent conflicting mutation", "Issue conflicting mutations against the same cart", [200, 400, 409]),
          variant("request replay", "Replay the exact successful request", [200, 400, 409]),
        ],
      },
      {
        name: "fields-localization-authentication",
        quota: 10,
        variants: [
          missingPublishableKey(),
          invalidPublishableKey(),
          missingCustomerAuth(),
          variant("minimal fields", "Request only cart id,currency_code,total"),
          variant("valid locale", "Send a configured locale and verify localized item fields"),
        ],
      },
      {
        name: "response-cross-operation-consistency",
        quota: 10,
        variants: [
          variant("JSON contract", "Verify the documented response schema and Content-Type"),
          variant("total equation", "Verify total components reconcile arithmetically"),
          variant("mutation/read consistency", "Retrieve the cart after mutation and compare persisted fields"),
          variant("timestamps", "Verify created_at and updated_at semantics"),
          variant("identifier prefixes", "Verify cart, item, and related IDs use documented prefixes"),
        ],
      },
    ],
  },
  customers: {
    label: "Customers",
    prefix: "MED-STORE-CUSTOMERS",
    target: 90,
    operations: [
      operation("create-customer", "Create the authenticated customer", "POST", "/store/customers", {
        customerAuth: true,
        preconditions: ["A valid customer registration token exists"],
        responseContract: "StoreCustomerResponse",
      }),
      operation("get-customer", "Retrieve the current customer", "GET", "/store/customers/me", {
        customerAuth: true,
        responseContract: "StoreCustomerResponse",
      }),
      operation("update-customer", "Update the current customer", "POST", "/store/customers/me", {
        customerAuth: true,
        responseContract: "StoreCustomerResponse",
      }),
      operation("list-addresses", "List customer addresses", "GET", "/store/customers/me/addresses", {
        customerAuth: true,
        responseContract: "StoreCustomerAddressListResponse",
      }),
      operation("create-address", "Create a customer address", "POST", "/store/customers/me/addresses", {
        customerAuth: true,
        responseContract: "StoreCustomerResponse",
      }),
      operation("get-address", "Retrieve a customer address", "GET", "/store/customers/me/addresses/{address_id}", {
        customerAuth: true,
        responseContract: "StoreCustomerAddressResponse",
      }),
      operation("update-address", "Update a customer address", "POST", "/store/customers/me/addresses/{address_id}", {
        customerAuth: true,
        responseContract: "StoreCustomerResponse",
      }),
      operation("delete-address", "Delete a customer address", "DELETE", "/store/customers/me/addresses/{address_id}", {
        customerAuth: true,
        responseContract: "StoreCustomerResponse",
      }),
    ],
    categories: [
      {
        name: "registration-token-authentication",
        quota: 20,
        variants: [
          variant("valid customer token", "Use a valid unexpired customer token"),
          missingCustomerAuth(),
          variant("expired customer token", "Use an expired customer JWT", 401),
          variant("malformed bearer token", "Use a malformed Authorization bearer value", 401),
          variant("admin token used as customer", "Use an Admin API token", [401, 403]),
          missingPublishableKey(),
          invalidPublishableKey(),
        ],
      },
      {
        name: "address-crud-ownership",
        quota: 25,
        operationKeys: ["list-addresses", "create-address", "get-address", "update-address", "delete-address"],
        variants: [
          variant("valid address lifecycle", "Execute with a complete address owned by the customer"),
          variant("address owned by another customer", "Use another customer's address ID", [403, 404]),
          variant("nonexistent address", "Use a syntactically valid nonexistent address ID", 404),
          variant("malformed address ID", "Use an identifier with the wrong prefix", [400, 404]),
          variant("missing address line", "Omit address_1", [400, 422]),
          variant("unsupported country", "Use a country not configured in the target region", [400, 422]),
          variant("duplicate default address", "Create an address identical to an existing address", [200, 409]),
          variant("delete then retrieve", "Delete an address and then retrieve it", 404),
        ],
      },
      {
        name: "profile-validation-updates",
        quota: 15,
        operationKeys: ["create-customer", "get-customer", "update-customer"],
        variants: [
          variant("valid profile", "Use valid names, phone, and metadata"),
          variant("mixed-case email", "Use a mixed-case email and verify normalization"),
          variant("invalid email", "Use an invalid email format", [400, 422]),
          variant("empty first name", "Set first_name to an empty string", [200, 400, 422]),
          variant("overlong profile field", "Exceed the documented practical field length", [400, 422]),
          variant("unknown profile property", "Send an undocumented property", [200, 400, 422]),
        ],
      },
      {
        name: "privacy-authorization-idor",
        quota: 15,
        variants: [
          variant("customer isolation", "Verify response data belongs only to the authenticated customer"),
          variant("resource ID enumeration", "Attempt sequential and random IDs owned by other customers", [403, 404]),
          variant("PII response minimization", "Verify credentials and password hashes are never returned"),
          variant("token subject mismatch", "Use a token whose subject does not match the requested resource", [403, 404]),
          variant("deleted customer token", "Use a token for a deleted customer", [401, 404]),
        ],
      },
      {
        name: "fields-localization-pagination",
        quota: 8,
        variants: [
          variant("minimal fields", "Request only id,email"),
          variant("unknown field", "Request an undocumented field", [400, 422]),
          variant("valid locale", "Send a configured locale"),
          variant("address pagination", "Request address list pagination boundaries"),
        ],
      },
      {
        name: "duplicate-concurrency",
        quota: 7,
        operationKeys: ["create-customer", "update-customer", "create-address", "update-address", "delete-address"],
        variants: [
          variant("duplicate registration", "Register the same email twice", [400, 409, 422]),
          variant("concurrent profile updates", "Update the same profile concurrently"),
          variant("concurrent address deletion", "Delete the same address concurrently", [200, 404, 409]),
          variant("replayed mutation", "Replay the same successful mutation", [200, 400, 409]),
        ],
      },
    ],
  },
  regions: {
    label: "Regions",
    prefix: "MED-STORE-REGIONS",
    target: 40,
    operations: [
      operation("list-regions", "List regions", "GET", "/store/regions", {
        responseContract: "StoreRegionListResponse",
      }),
      operation("get-region", "Retrieve a region", "GET", "/store/regions/{id}", {
        preconditions: ["A configured region exists"],
        responseContract: "StoreRegionResponse",
      }),
    ],
    categories: [
      {
        name: "filtering-pagination-sorting",
        quota: 12,
        variants: [
          variant("default pagination", "Omit limit and offset"),
          variant("limit one", "Set limit=1"),
          variant("negative limit", "Set limit=-1", [400, 422]),
          variant("large offset", "Set offset beyond available regions"),
          variant("filter by ID", "Filter using an existing region ID"),
          variant("ascending name order", "Request ascending name order"),
        ],
      },
      {
        name: "list-retrieve-contracts",
        quota: 8,
        variants: [
          variant("successful response", "Send the minimum valid request"),
          variant("JSON content type", "Verify Content-Type is application/json"),
          variant("required region fields", "Verify id,name,currency_code are present"),
          variant("list metadata", "Verify count,limit,offset consistency"),
        ],
      },
      {
        name: "fields-relations-localization",
        quota: 8,
        variants: [
          variant("minimal fields", "Request fields=id,name,currency_code"),
          variant("country relation", "Request countries and payment providers"),
          variant("unknown field", "Request an undocumented field", [400, 422]),
          variant("valid locale", "Send a configured locale"),
        ],
      },
      {
        name: "invalid-ids-publishable-key",
        quota: 8,
        variants: [
          missingPublishableKey(),
          invalidPublishableKey(),
          variant("nonexistent region", "Use a syntactically valid nonexistent region ID", 404),
          variant("malformed region ID", "Use an identifier with the wrong prefix", [400, 404]),
        ],
      },
      {
        name: "cross-response-consistency",
        quota: 4,
        variants: [
          variant("list/detail consistency", "Compare the same region in list and detail responses"),
          variant("currency consistency", "Verify region currency matches returned prices and configuration"),
        ],
      },
    ],
  },
  orders: {
    label: "Orders",
    prefix: "MED-STORE-ORDERS",
    target: 100,
    operations: [
      operation("list-orders", "List customer orders", "GET", "/store/orders", {
        customerAuth: true,
        responseContract: "StoreOrderListResponse",
      }),
      operation("get-order", "Retrieve an order", "GET", "/store/orders/{id}", {
        preconditions: ["An order exists"],
        responseContract: "StoreOrderResponse",
      }),
      operation("accept-transfer", "Accept an order transfer", "POST", "/store/orders/{id}/transfer/accept", {
        preconditions: ["A pending transfer and valid transfer token exist"],
        responseContract: "StoreOrderResponse",
      }),
      operation("cancel-transfer", "Cancel an order transfer", "POST", "/store/orders/{id}/transfer/cancel", {
        customerAuth: true,
        preconditions: ["The authenticated owner has a pending transfer"],
        responseContract: "StoreOrderResponse",
      }),
      operation("decline-transfer", "Decline an order transfer", "POST", "/store/orders/{id}/transfer/decline", {
        preconditions: ["A pending transfer and valid transfer token exist"],
        responseContract: "StoreOrderResponse",
      }),
      operation("request-transfer", "Request an order transfer", "POST", "/store/orders/{id}/transfer/request", {
        customerAuth: true,
        preconditions: ["The authenticated customer owns the order"],
        responseContract: "StoreOrderResponse",
      }),
    ],
    categories: [
      {
        name: "transfer-lifecycle-state",
        quota: 30,
        operationKeys: ["accept-transfer", "cancel-transfer", "decline-transfer", "request-transfer"],
        variants: [
          variant("valid transfer transition", "Execute from the documented valid transfer state"),
          variant("already accepted transfer", "Execute after transfer acceptance", [400, 409, 422]),
          variant("already declined transfer", "Execute after transfer decline", [400, 409, 422]),
          variant("cancel without pending transfer", "Cancel when no transfer is pending", [400, 409, 422]),
          variant("transfer completed order", "Request transfer for an ineligible completed state", [400, 409, 422]),
          variant("repeat transition", "Repeat a successful transition", [200, 400, 409]),
        ],
      },
      {
        name: "ownership-privacy-authorization-idor",
        quota: 25,
        variants: [
          variant("owner access", "Access an order owned by the authenticated customer"),
          variant("another customer's order", "Attempt to access another customer's order", [403, 404]),
          variant("random order enumeration", "Attempt random syntactically valid order IDs", [403, 404]),
          variant("guest order privacy", "Verify guest order access requires the documented proof"),
          variant("PII minimization", "Verify payment secrets and internal-only fields are not returned"),
          missingCustomerAuth(),
          variant("admin token used as customer", "Use an Admin API token", [401, 403]),
        ],
      },
      {
        name: "list-detail-filter-pagination",
        quota: 18,
        operationKeys: ["list-orders", "get-order"],
        variants: [
          variant("default pagination", "Omit limit and offset"),
          variant("limit one", "Set limit=1"),
          variant("negative limit", "Set limit=-1", [400, 422]),
          variant("large offset", "Set offset beyond available orders"),
          variant("descending created date", "Request descending created_at order"),
          variant("status filter", "Filter by a documented order status"),
          variant("list/detail consistency", "Compare core fields between list and detail"),
        ],
      },
      {
        name: "transfer-token-replay-concurrency",
        quota: 15,
        operationKeys: ["accept-transfer", "decline-transfer", "request-transfer", "cancel-transfer"],
        variants: [
          variant("valid transfer token", "Use the current unexpired token"),
          variant("expired transfer token", "Use an expired transfer token", [400, 401, 422]),
          variant("malformed transfer token", "Use a malformed transfer token", [400, 401, 422]),
          variant("token for another order", "Use a valid token issued for another order", [400, 403, 404]),
          variant("replayed transfer token", "Reuse a consumed transfer token", [400, 409, 422]),
          variant("concurrent accept and decline", "Submit accept and decline concurrently", [200, 400, 409]),
        ],
      },
      {
        name: "fields-localization-status-contracts",
        quota: 7,
        variants: [
          variant("minimal fields", "Request only id,status,total"),
          variant("line-item relations", "Request item variant and product fields"),
          variant("valid locale", "Send a configured locale"),
          variant("status contract", "Verify fulfillment and payment status enums"),
        ],
      },
      {
        name: "invalid-id-body-publishable-key",
        quota: 5,
        variants: [
          missingPublishableKey(),
          invalidPublishableKey(),
          variant("nonexistent order", "Use a syntactically valid nonexistent order ID", 404),
          variant("malformed order ID", "Use an identifier with the wrong prefix", [400, 404]),
          variant("malformed JSON body", "Send malformed JSON to a transfer mutation", 400),
        ],
      },
    ],
  },
  promotions: {
    label: "Cart Promotions",
    prefix: "MED-STORE-PROMOTIONS",
    target: 40,
    operations: [
      operation("add-promotions", "Add promotions to a cart", "POST", "/store/carts/{id}/promotions", {
        preconditions: ["An active cart and promotion code exist"],
        responseContract: "StoreCartResponse",
      }),
      operation("remove-promotions", "Remove promotions from a cart", "DELETE", "/store/carts/{id}/promotions", {
        preconditions: ["An active cart has an applied promotion"],
        responseContract: "StoreCartResponse",
      }),
    ],
    categories: [
      {
        name: "invalid-expired-inactive-ineligible",
        quota: 12,
        variants: [
          variant("unknown promotion code", "Use a promotion code that does not exist", [400, 404, 422]),
          variant("expired promotion", "Use an expired promotion code", [400, 422]),
          variant("inactive promotion", "Use an inactive promotion code", [400, 422]),
          variant("not-yet-active promotion", "Use a promotion before its start date", [400, 422]),
          variant("minimum spend not met", "Use a promotion whose minimum spend is not met", [400, 422]),
          variant("product eligibility not met", "Use a promotion for an ineligible product", [400, 422]),
        ],
      },
      {
        name: "stacking-exclusivity-duplicates-automatic",
        quota: 10,
        variants: [
          variant("stackable promotions", "Apply two compatible promotion codes"),
          variant("exclusive promotion conflict", "Apply an exclusive code with another code", [200, 400, 409, 422]),
          variant("duplicate promotion", "Apply the same promotion twice", [200, 400, 409]),
          variant("automatic and code promotion", "Combine an automatic promotion with a valid code"),
          variant("remove automatic promotion", "Attempt to remove an automatic promotion", [200, 400, 422]),
        ],
      },
      {
        name: "add-remove-happy-paths",
        quota: 8,
        variants: [
          variant("apply valid percentage code", "Apply an eligible percentage promotion"),
          variant("apply valid fixed code", "Apply an eligible fixed-amount promotion"),
          variant("remove applied code", "Remove an applied promotion code"),
          variant("apply case-sensitive code", "Verify documented promotion code case behavior"),
        ],
      },
      {
        name: "totals-tax-shipping-rounding",
        quota: 6,
        variants: [
          variant("item discount totals", "Verify item discount and cart total reconciliation"),
          variant("shipping promotion totals", "Verify shipping discount recalculation"),
          variant("tax-inclusive discount", "Verify discount and tax totals in a tax-inclusive region"),
          variant("currency rounding", "Exercise a discount amount requiring currency rounding"),
        ],
      },
      {
        name: "replay-concurrency-body-key-validation",
        quota: 4,
        variants: [
          variant("concurrent promotion mutations", "Add and remove the same promotion concurrently", [200, 400, 409]),
          variant("empty promotion codes", "Send an empty promotion-code collection", [200, 400, 422]),
          missingPublishableKey(),
          invalidPublishableKey(),
        ],
      },
    ],
  },
};

function variant(title, variation, status = 200, assertions = []) {
  return { title, variation, status, assertions };
}

function missingPublishableKey() {
  return variant(
    "missing publishable API key",
    "Omit the x-publishable-api-key header",
    400,
    ["Error type is not_allowed", "Message identifies the required publishable API key"],
  );
}

function invalidPublishableKey() {
  return variant(
    "invalid publishable API key",
    "Send a syntactically valid but unknown x-publishable-api-key value",
    [400, 401],
    ["Response does not expose protected Store API data"],
  );
}

function missingCustomerAuth() {
  return variant(
    "missing customer authentication",
    "Omit both the customer bearer token and customer session cookie",
    401,
    ["Response does not expose customer-scoped data"],
  );
}

function selectOperations(domain, category) {
  if (!category.operationKeys) {
    return domain.operations;
  }
  return domain.operations.filter((item) => category.operationKeys.includes(item.key));
}

function buildHeaders(operationDefinition, scenario) {
  const headers = [
    {
      name: "x-publishable-api-key",
      value: "${MEDUSA_PUBLISHABLE_API_KEY}",
    },
  ];

  if (operationDefinition.customerAuth) {
    headers.push({
      name: "Authorization",
      value: "Bearer ${CUSTOMER_JWT}",
    });
  }

  if (scenario.title === "missing publishable API key") {
    return headers.filter((header) => header.name !== "x-publishable-api-key");
  }
  if (scenario.title === "invalid publishable API key") {
    return headers.map((header) =>
      header.name === "x-publishable-api-key"
        ? { ...header, value: "pk_invalid_test_value" }
        : header,
    );
  }
  if (scenario.title === "missing customer authentication") {
    return headers.filter((header) => header.name !== "Authorization");
  }
  return headers;
}

function buildCases(domainKey, domain) {
  const cases = [];
  let sequence = 1;

  for (const category of domain.categories) {
    const operations = selectOperations(domain, category);

    for (let index = 0; index < category.quota; index += 1) {
      const operationDefinition = operations[index % operations.length];
      const scenario = category.variants[index % category.variants.length];
      const cycle = Math.floor(index / (operations.length * category.variants.length));
      const datasetSuffix = cycle > 0 ? ` (dataset ${cycle + 1})` : "";
      const status = scenario.status ?? 200;

      const requiredAssertions = [
        `HTTP status matches ${Array.isArray(status) ? status.join(" or ") : status}`,
      ];
      if (status === 200) {
        requiredAssertions.push(operationDefinition.responseContract);
      }

      cases.push({
        id: `${domain.prefix}-${String(sequence).padStart(3, "0")}`,
        title: `${operationDefinition.title}: ${scenario.title}${datasetSuffix}`,
        domain: domain.label,
        category: category.name,
        priority:
          category.name.includes("auth") ||
          category.name.includes("privacy") ||
          category.name.includes("lifecycle") ||
          category.name.includes("happy")
            ? "high"
            : "medium",
        source: {
          apiVersion,
          method: operationDefinition.method,
          path: operationDefinition.route,
        },
        auth: {
          publishableApiKey: true,
          customerAuthentication: operationDefinition.customerAuth,
        },
        preconditions: operationDefinition.preconditions,
        request: {
          method: operationDefinition.method,
          path: operationDefinition.route,
          headers: buildHeaders(operationDefinition, scenario),
          variation: scenario.variation,
        },
        expected: {
          status,
          assertions: [...requiredAssertions, ...(scenario.assertions ?? [])],
        },
        automation: {
          status: "candidate",
          notes:
            "Generated from the v2.21.2 Store API contract and a risk-based matrix. Refine concrete fixtures and payload values before automation.",
        },
      });

      sequence += 1;
    }
  }

  if (cases.length !== domain.target) {
    throw new Error(
      `${domain.label}: generated ${cases.length} cases, expected ${domain.target}`,
    );
  }

  return cases;
}

const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://example.local/schemas/medusa-store-test-cases.schema.json",
  title: "Medusa Store API Test Case Catalog",
  type: "object",
  required: ["source", "domain", "generated", "caseCount", "cases"],
  properties: {
    $schema: { type: "string" },
    source: {
      type: "object",
      required: ["api", "version", "openApi"],
      properties: {
        api: { const: "Medusa Store API" },
        version: { type: "string" },
        openApi: { type: "string", format: "uri" },
      },
      additionalProperties: false,
    },
    domain: { type: "string" },
    generated: { const: true },
    caseCount: { type: "integer", minimum: 1 },
    cases: {
      type: "array",
      items: { $ref: "#/$defs/testCase" },
    },
  },
  additionalProperties: false,
  $defs: {
    status: {
      oneOf: [
        { type: "integer", minimum: 100, maximum: 599 },
        {
          type: "array",
          minItems: 1,
          uniqueItems: true,
          items: { type: "integer", minimum: 100, maximum: 599 },
        },
      ],
    },
    header: {
      type: "object",
      required: ["name", "value"],
      properties: {
        name: { type: "string" },
        value: { type: "string" },
      },
      additionalProperties: false,
    },
    testCase: {
      type: "object",
      required: [
        "id",
        "title",
        "domain",
        "category",
        "priority",
        "source",
        "auth",
        "preconditions",
        "request",
        "expected",
        "automation",
      ],
      properties: {
        id: { type: "string", pattern: "^MED-STORE-[A-Z]+-[0-9]{3}$" },
        title: { type: "string", minLength: 1 },
        domain: { type: "string" },
        category: { type: "string" },
        priority: { enum: ["critical", "high", "medium", "low"] },
        source: {
          type: "object",
          required: ["apiVersion", "method", "path"],
          properties: {
            apiVersion: { type: "string" },
            method: { enum: ["GET", "POST", "DELETE"] },
            path: { type: "string", pattern: "^/store/" },
          },
          additionalProperties: false,
        },
        auth: {
          type: "object",
          required: ["publishableApiKey", "customerAuthentication"],
          properties: {
            publishableApiKey: { type: "boolean" },
            customerAuthentication: { type: "boolean" },
          },
          additionalProperties: false,
        },
        preconditions: {
          type: "array",
          items: { type: "string" },
        },
        request: {
          type: "object",
          required: ["method", "path", "headers", "variation"],
          properties: {
            method: { enum: ["GET", "POST", "DELETE"] },
            path: { type: "string" },
            headers: {
              type: "array",
              items: { $ref: "#/$defs/header" },
            },
            variation: { type: "string" },
          },
          additionalProperties: false,
        },
        expected: {
          type: "object",
          required: ["status", "assertions"],
          properties: {
            status: { $ref: "#/$defs/status" },
            assertions: {
              type: "array",
              minItems: 1,
              items: { type: "string" },
            },
          },
          additionalProperties: false,
        },
        automation: {
          type: "object",
          required: ["status", "notes"],
          properties: {
            status: { enum: ["candidate", "approved", "automated", "deferred"] },
            notes: { type: "string" },
            spec: { type: "string" },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
  },
};

await mkdir(outputDirectory, { recursive: true });

const manifestDomains = [];
let totalGeneratedCases = 0;

for (const [domainKey, domain] of Object.entries(domains)) {
  const cases = buildCases(domainKey, domain);
  const fileName = `${domainKey}.cases.json`;
  const document = {
    $schema: "./test-case.schema.json",
    source: {
      api: "Medusa Store API",
      version: apiVersion,
      openApi: sourceSpec,
    },
    domain: domain.label,
    generated: true,
    caseCount: cases.length,
    cases,
  };

  await writeJson(path.join(outputDirectory, fileName), document);
  manifestDomains.push({
    domain: domain.label,
    file: fileName,
    caseCount: cases.length,
  });
  totalGeneratedCases += cases.length;
}

if (totalGeneratedCases !== 500) {
  throw new Error(`Generated ${totalGeneratedCases} total cases, expected 500`);
}

await writeJson(path.join(outputDirectory, "test-case.schema.json"), schema);
await writeJson(path.join(outputDirectory, "manifest.json"), {
  catalog: "Medusa Store API test-case candidates",
  apiVersion,
  sourceSpec,
  generatedCaseCount: totalGeneratedCases,
  supplementalCases: [
    {
      id: "MED-API-001",
      file: "backend-health.json",
      note: "Backend health is outside the /store OpenAPI surface and is not included in the 500 generated candidates.",
    },
  ],
  domains: manifestDomains,
  lifecycle: {
    generatedStatus: "candidate",
    reviewRequiredBeforeAutomation: true,
  },
});

console.log(`Generated ${totalGeneratedCases} Medusa Store API candidates in ${outputDirectory}`);

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
