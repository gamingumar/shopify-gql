import _yargs from "yargs";
import { hideBin } from "yargs/helpers";
const yargs = _yargs(hideBin(process.argv));
import fetch from "node-fetch";
import { createClient, gql } from "@urql/core";
let argv = yargs.argv;

console.log("order id updating: ", argv.orderId);

const shopifyToken = "shpat_";
const url = "https://test.myshopify.com/admin/api/graphql.json";

async function callApi() {
  const client = createClient({
    url,
    fetch,
    fetchOptions: {
      headers: {
        "Content-Type": "application/json ",
        "X-Shopify-Access-Token": shopifyToken,
      },
    },
  });

  let orderNumber = argv.orderId; //5073992286358

  const orderId = `gid://shopify/Order/${orderNumber}`;

  const getOrderQuery = gql`
    query {
      order(id: "${orderId}") {
        customAttributes {
          key
          value
        }
      }
    }
  `;
  const orderDetail = await client.query(getOrderQuery).toPromise();

  const customAttributes = orderDetail?.data?.order?.customAttributes;

  const cleanCustomAttr = customAttributes.map((c) => {
    return {
      key: c.key,
      value: c.value,
    };
  });

  const newCustomAttributes = [
    ...cleanCustomAttr,
    {
      key: "bank_account_name",
      value: " ",
    },
    {
      key: "bank_account_number",
      value: " ",
    },
    {
      key: "bank_name",
      value: " ",
    },
  ];

  console.log("fetched customAttributes for order, updating now...");
  if (customAttributes) {
    // make update api call.

    const ORDER_UPDATE_MUTATION = `
      mutation orderUpdate($input: OrderInput!) {
        orderUpdate(input: $input) {
          order {
            id
            customAttributes {
              key
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const orderUpdateResponse = await client
      .mutation(ORDER_UPDATE_MUTATION, {
        input: {
          id: orderId,
          customAttributes: [...newCustomAttributes],
        },
      })
      .toPromise();

    if (orderUpdateResponse.data) {
      console.log("====================================");
      console.log(`bank info keys added for order ${orderId}`);
      console.log("====================================");
    } else {
      console.log("====================================");
      console.log(`something went wrong, unable to update order ${orderId}`);
      console.log("====================================");
    }
  } else {
    console.log(
      `unable to get existing custom attributes for order ${orderId}`
    );
  }
}

callApi();
