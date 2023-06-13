import json
import boto3

dynamodb = boto3.resource("dynamodb")
dynamodb_client = boto3.client("dynamodb")
table = dynamodb.Table("OEE-Machines")


def lambda_handler(event, context):
    http_method = event["requestContext"]["http"]["method"]

    print("http_method: ", http_method)

    if http_method == "POST":
        return create_item(event)
    elif http_method == "GET":
        if (
            "all" in event["queryStringParameters"]
            and event["queryStringParameters"]["all"] == "true"
        ):
            return list_items(event)
        else:
            return get_item(event)

    elif http_method == "PUT":
        body = json.loads(event["body"])
        table_name = body.get("table_name", None)
        id = event["requestContext"]["http"]["path"].split("/")[-1]

        if table_name == "OEE-P-Orders":
            attributes = {
                k: body[k] for k in ["Machine", "Validated_per_hour", "Varenummer"]
            }
            return update_item(id, table_name, attributes, key_name="P_Order")

        elif table_name == "OEE-Daily-Numbers":
            attributes = {
                k: body[k]
                for k in [
                    "Date",
                    "Discarded_parts",
                    "Machine",
                    "Operator",
                    "P_Order",
                    "Produced_parts",
                    "Production_End_time",
                    "Production_Start_time",
                    "Shift",
                    "Varenummer",
                ]
            }
            return update_item(id, table_name, attributes)

        elif table_name == "OEE-Stop-Registrations":
            attributes = {
                k: body[k]
                for k in [
                    "Date",
                    "End_time",
                    "Machine",
                    "Operator",
                    "P_Order",
                    "Reason",
                    "Shift",
                    "Start_time",
                    "Varenummer",
                ]
            }
            return update_item(id, table_name, attributes)

        elif table_name == "OEE-Machines":
            attributes = {k: body.get(k, None) for k in ["name", "imageUrl"]}
            print(f"attributes: {attributes}")
            return update_item(
                id, table_name, attributes, optional_attributes=["name", "imageUrl"]
            )

    elif http_method == "DELETE":
        return delete_machine(event)
    elif http_method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
            },
        }

    else:
        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
                "Content-Type": "application/json",
            },
            "body": "Invalid httpMethod",
        }


def create_item(event):
    body = json.loads(event["body"])
    table_name = body.pop("table")
    table = dynamodb.Table(table_name)

    return handle_table_operation(table, body, table_name)


def handle_table_operation(table, body, table_name):
    response = table.put_item(Item=body)

    success_message = {
        "OEE-P-Orders": "P-Order created successfully",
        "OEE-Machines": "Machine created successfully",
    }.get(table_name, "Item created successfully")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
            "Content-Type": "application/json",
        },
        "body": json.dumps(
            {
                "result": success_message,
                "data": body,
            }
        ),
    }


def get_item(event):
    table_name = event["queryStringParameters"]["table"]
    table = dynamodb.Table(table_name)
    if table_name == "OEE-P-Orders":
        identifier = "P_Order"
        id = event["queryStringParameters"]["P_Order"]
    elif table_name == "OEE-Machines":
        identifier = "id"
        id = event["queryStringParameters"]["id"]

    # Add a ProjectionExpression if specific attributes are requested
    projection_expression = event["queryStringParameters"].get("attributes", None)

    if projection_expression:
        response = table.get_item(
            Key={f"{identifier}": id}, ProjectionExpression=projection_expression
        )
    else:
        response = table.get_item(Key={f"{identifier}": id})

    if "Item" in response:
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
                "Content-Type": "application/json",
            },
            "body": json.dumps(response["Item"]),
        }
    else:
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
                "Content-Type": "application/json",
            },
            "body": json.dumps({"notFound": True}),
        }


def list_items(event):
    table_name = event["queryStringParameters"].pop("table")
    table = dynamodb.Table(table_name)

    response = table.scan()

    items = response["Items"]

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
            "Content-Type": "application/json",
        },
        "body": json.dumps(items),
    }


def update_item(id, table_name, attributes, key_name="id", optional_attributes=None):
    if optional_attributes is None:
        optional_attributes = []

    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(table_name)

    provided_attributes = {
        k: v
        for k, v in attributes.items()
        if k not in optional_attributes or v is not None
    }

    expression_attribute_names = {f"#{key}": key for key in provided_attributes}
    update_expression = "SET " + ", ".join(
        f"#{key} = :{key}" for key in provided_attributes
    )
    expression_attribute_values = {
        f":{key}": value for key, value in provided_attributes.items()
    }

    response = table.update_item(
        Key={key_name: id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values,
        ExpressionAttributeNames=expression_attribute_names,
        ReturnValues="UPDATED_NEW",
    )

    if table_name == "OEE-Machines":
        attribute_name = "machine"
    else:
        attribute_name = "item"

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
            "Content-Type": "application/json",
        },
        "body": json.dumps(
            {
                "result": f"{table_name} item updated successfully",
                f"{attribute_name}": response["Attributes"],
            }
        ),
    }


def delete_machine(event):
    id = event["requestContext"]["http"]["path"].split("/")[-1]

    response = table.delete_item(Key={"id": id})

    return {
        "statusCode": 200,
        "body": json.dumps({"result": "Machine deleted successfully"}),
    }
