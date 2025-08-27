import { cn } from "@mjs/ui/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@mjs/ui/primitives/alert";
import { Badge } from "@mjs/ui/primitives/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import { Separator } from "@mjs/ui/primitives/separator";
import { toast } from "@mjs/ui/primitives/sonner";
import { Tooltip } from "@mjs/ui/primitives/tooltip";
import { copyToClipboard } from "@mjs/utils/client";
import {
  Calendar,
  Coins,
  CreditCard,
  DollarSign,
  Info,
  Shield,
  User,
} from "lucide-react";
import type React from "react";

interface Variable {
  name: string;
  description: string;
  example?: string;
}

interface VariableCategory {
  title: string;
  icon: React.ReactNode;
  color: string;
  variables: Variable[];
}

export default function VariablesPanel({ className }: { className?: string }) {
  return (
    <Card className={cn("w-80 h-fit", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5" />
          Available Variables
        </CardTitle>
        <CardDescription className="text-sm">
          Click on any variable to copy it to your clipboard. Hover for details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Custom Variables Info */}
        <Alert className="bg-secondary-800/50 border-secondary">
          <Shield className="h-4 w-4 text-secondary" />
          <AlertTitle>Custom Variables</AlertTitle>
          <AlertDescription className="text-foreground">
            <p className="text-foreground">
              Add custom variables by wrapping words in double curly braces:{" "}
              <code className="bg-secondary px-2 py-1 rounded">{`{{customVariable}}`}</code>
            </p>
            <p className="text-white/90 mt-1 text-xs">
              Signer will be prompted to fill in any missing variables.
            </p>
          </AlertDescription>
        </Alert>

        <Separator />

        {/* Variable Categories */}
        <div className="space-y-4">
          {variableCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${category.color} text-white`}>
                  {category.icon}
                </div>
                <h3 className="font-medium text-sm">{category.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {category.variables.length}
                </Badge>
              </div>
              <div className="space-y-1 ml-6">
                {category.variables.map((variable, variableIndex) => (
                  <VariableItem key={variableIndex} variable={variable} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Usage Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Usage:</p>
          <ul className="space-y-1 ml-2">
            <li>• Use variables in your template with double curly braces</li>
            <li>• Variables will be replaced with actual values when sent</li>
            <li>• Missing variables will prompt for user input</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

const VariableItem = ({ variable }: { variable: Variable }) => (
  <Tooltip
    content={
      <div className="space-y-1">
        <p className="font-medium">{variable.description}</p>
        {variable.example && (
          <p className="text-xs text-muted-foreground">
            Example:{" "}
            <code className="bg-muted px-1 rounded">{variable.example}</code>
          </p>
        )}
      </div>
    }
  >
    <div
      role="button"
      onClick={() => {
        const v = `{{${variable.name.trim()}}}`;
        copyToClipboard(v);
        toast.success(`${v} Copied to clipboard`);
      }}
      className="flex items-center justify-between p-2 rounded-md hover:bg-secondary-800/50 cursor-help group"
    >
      <code className="text-sm font-mono bg-secondary px-2 py-1 rounded text-foreground">
        {`{{${variable.name}}}`}
      </code>
      <Info className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  </Tooltip>
);

const variableCategories: VariableCategory[] = [
  {
    title: "Recipient Profile",
    icon: <User className="h-4 w-4" />,
    color: "bg-blue-500",
    variables: [
      {
        name: "recipient.firstName",
        description: "The recipient's first name from their profile",
        example: "John",
      },
      {
        name: "recipient.lastName",
        description: "The recipient's last name from their profile",
        example: "Smith",
      },
      {
        name: "recipient.email",
        description: "The recipient's email address",
        example: "john.smith@example.com",
      },
    ],
  },
  {
    title: "Recipient Address",
    icon: <User className="h-4 w-4" />,
    color: "bg-green-500",
    variables: [
      {
        name: "recipient.city",
        description: "The recipient's city from their address",
        example: "New York",
      },
      {
        name: "recipient.zipcode",
        description: "The recipient's ZIP/postal code",
        example: "10001",
      },
      {
        name: "recipient.state",
        description: "The recipient's state or province",
        example: "NY",
      },
      {
        name: "recipient.country",
        description: "The recipient's country",
        example: "United States",
      },
    ],
  },
  {
    title: "Token Information",
    icon: <Coins className="h-4 w-4" />,
    color: "bg-purple-500",
    variables: [
      {
        name: "token.quantity",
        description: "The quantity of tokens purchased",
        example: "1000",
      },
      {
        name: "token.symbol",
        description: "The symbol of the token purchased",
        example: "TILE",
      },
    ],
  },
  {
    title: "Payment Details",
    icon: <CreditCard className="h-4 w-4" />,
    color: "bg-orange-500",
    variables: [
      {
        name: "paid.currency",
        description: "The currency used for payment",
        example: "USD",
      },
      {
        name: "paid.amount",
        description:
          "The total amount paid (formatted with appropriate decimals)",
        example: "5000.0000",
      },
    ],
  },
  {
    title: "Sale Information",
    icon: <DollarSign className="h-4 w-4" />,
    color: "bg-red-500",
    variables: [
      {
        name: "sale.currency",
        description: "The currency configured for the sale",
        example: "USD",
      },
      {
        name: "sale.equivalentAmount",
        description:
          "The total amount to pay by signer converted to the sale currency",
        example: "5000.00",
      },
    ],
  },
  {
    title: "Date",
    icon: <Calendar className="h-4 w-4" />,
    color: "bg-indigo-500",
    variables: [
      {
        name: "date",
        description: "Signature date in YYYY-MM-DD format",
        example: "2025-09-24",
      },
    ],
  },
];
