import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const catalogDirectory = path.resolve("test-cases/medusa/store-api");
const canvasDirectory = path.join(
  os.homedir(),
  ".cursor",
  "projects",
  "c-Users-ecast-Documents-GitHub-playwright-framework",
  "canvases",
);
const canvasPath = path.join(canvasDirectory, "medusa-store-api-cases.canvas.tsx");

const files = [
  "products.cases.json",
  "carts.cases.json",
  "customers.cases.json",
  "regions.cases.json",
  "orders.cases.json",
  "promotions.cases.json",
];

const cases = [];
for (const file of files) {
  const document = JSON.parse(
    await readFile(path.join(catalogDirectory, file), "utf8"),
  );
  for (const testCase of document.cases) {
    cases.push({
      ...testCase,
      file: `test-cases/medusa/store-api/${file}`,
    });
  }
}

const serializedCases = JSON.stringify(cases);

const source = `import {
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Code,
  Divider,
  Grid,
  H1,
  H2,
  Pill,
  Row,
  Select,
  Stack,
  Stat,
  Table,
  Text,
  TextInput,
  useCanvasAction,
  useCanvasState,
  useHostTheme,
  useMemo,
  useState,
} from "cursor/canvas";

type CaseRecord = {
  id: string;
  title: string;
  domain: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  source: {
    apiVersion: string;
    method: "GET" | "POST" | "DELETE";
    path: string;
  };
  auth: {
    publishableApiKey: boolean;
    customerAuthentication: boolean;
  };
  preconditions: string[];
  request: {
    method: "GET" | "POST" | "DELETE";
    path: string;
    headers: Array<{ name: string; value: string }>;
    variation: string;
  };
  expected: {
    status: number | number[];
    assertions: string[];
  };
  automation: {
    status: "candidate" | "approved" | "automated" | "deferred";
    notes: string;
    spec?: string;
  };
  file: string;
};

const cases: CaseRecord[] = ${serializedCases};
const pageSize = 40;
const domains = ["All", ...Array.from(new Set(cases.map((item) => item.domain)))];

function statusLabel(status: number | number[]) {
  return Array.isArray(status) ? status.join(" / ") : String(status);
}

function App() {
  const theme = useHostTheme();
  const dispatch = useCanvasAction();
  const [domain, setDomain] = useCanvasState("medusa-cases-domain", "All");
  const [search, setSearch] = useCanvasState("medusa-cases-search", "");
  const [priority, setPriority] = useCanvasState("medusa-cases-priority", "all");
  const [method, setMethod] = useCanvasState("medusa-cases-method", "all");
  const [selectedId, setSelectedId] = useCanvasState(
    "medusa-cases-selected",
    cases[0].id,
  );
  const [page, setPage] = useState(0);

  const domainCounts = useMemo(
    () =>
      Object.fromEntries(
        domains.slice(1).map((name) => [
          name,
          cases.filter((item) => item.domain === name).length,
        ]),
      ),
    [],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cases.filter((item) => {
      const matchesDomain = domain === "All" || item.domain === domain;
      const matchesPriority = priority === "all" || item.priority === priority;
      const matchesMethod = method === "all" || item.source.method === method;
      const matchesSearch =
        !query ||
        item.id.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.source.path.toLowerCase().includes(query);
      return matchesDomain && matchesPriority && matchesMethod && matchesSearch;
    });
  }, [domain, method, priority, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const selected =
    cases.find((item) => item.id === selectedId) ?? filtered[0] ?? cases[0];

  const applyDomain = (value: string) => {
    setDomain(value);
    setPage(0);
  };

  return (
    <Stack
      gap={18}
      style={{
        minHeight: "100vh",
        padding: 20,
        background: theme.bg.editor,
        color: theme.text.primary,
      }}
    >
      <Row justify="space-between" align="start" gap={20}>
        <Stack gap={5}>
          <H1>Medusa Store API test catalog</H1>
          <Text tone="secondary">
            TestRail-style view of 500 generated candidates for Medusa v2.21.2.
          </Text>
        </Stack>
        <Row gap={22} align="start">
          <Stat value={cases.length} label="Total candidates" />
          <Stat
            value={cases.filter((item) => item.priority === "high").length}
            label="High priority"
            tone="warning"
          />
          <Stat value={domains.length - 1} label="Suites" />
        </Row>
      </Row>

      <Callout tone="info" title="Candidate catalog">
        Cases are generated from the versioned Store API contract and risk matrix.
        Review payloads, fixtures, and accepted error statuses before marking a case approved.
      </Callout>

      <Grid
        columns="190px minmax(560px, 1fr) minmax(330px, 0.62fr)"
        gap={16}
        align="start"
      >
        <Card stickyHeader style={{ maxHeight: 760, overflow: "auto" }}>
          <CardHeader trailing={<Pill size="sm">{cases.length}</Pill>}>Suites</CardHeader>
          <CardBody>
            <Stack gap={7}>
              {domains.map((name) => (
                <Button
                  key={name}
                  variant={domain === name ? "primary" : "ghost"}
                  onClick={() => applyDomain(name)}
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <span>{name}</span>
                  <span>{name === "All" ? cases.length : domainCounts[name]}</span>
                </Button>
              ))}
            </Stack>
          </CardBody>
        </Card>

        <Stack gap={12}>
          <Row gap={8} align="center" wrap>
            <TextInput
              type="search"
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(0);
              }}
              placeholder="Search ID, title, category, or route"
              style={{ minWidth: 300, flex: 1 }}
            />
            <Select
              value={priority}
              onChange={(value) => {
                setPriority(value);
                setPage(0);
              }}
              options={[
                { value: "all", label: "All priorities" },
                { value: "critical", label: "Critical" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ]}
            />
            <Select
              value={method}
              onChange={(value) => {
                setMethod(value);
                setPage(0);
              }}
              options={[
                { value: "all", label: "All methods" },
                { value: "GET", label: "GET" },
                { value: "POST", label: "POST" },
                { value: "DELETE", label: "DELETE" },
              ]}
            />
          </Row>

          <Row justify="space-between" align="center">
            <H2>Cases</H2>
            <Text tone="secondary" size="small">
              {filtered.length} matching · page {safePage + 1} of {totalPages}
            </Text>
          </Row>

          <Table
            stickyHeader
            striped
            headers={["ID", "Case", "Method", "Route", "Priority", "Expected"]}
            rows={visible.map((item) => [
              <Button
                key={item.id}
                variant={selected.id === item.id ? "primary" : "ghost"}
                onClick={() => setSelectedId(item.id)}
              >
                {item.id.replace("MED-STORE-", "")}
              </Button>,
              <Text key={item.id + "-title"} size="small" truncate>
                {item.title}
              </Text>,
              <Code key={item.id + "-method"}>{item.source.method}</Code>,
              <Code key={item.id + "-path"}>{item.source.path}</Code>,
              <Pill key={item.id + "-priority"} size="sm">
                {item.priority}
              </Pill>,
              <Code key={item.id + "-status"}>
                {statusLabel(item.expected.status)}
              </Code>,
            ])}
            style={{ maxHeight: 620 }}
            emptyMessage="No cases match the current filters."
          />

          <Row justify="space-between" align="center">
            <Button
              variant="secondary"
              disabled={safePage === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              Previous
            </Button>
            <Text size="small" tone="secondary">
              Showing {visible.length} of {filtered.length}
            </Text>
            <Button
              variant="secondary"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
            >
              Next
            </Button>
          </Row>
        </Stack>

        <Card stickyHeader style={{ maxHeight: 760, overflow: "auto" }}>
          <CardHeader trailing={<Pill size="sm">{selected.automation.status}</Pill>}>
            {selected.id}
          </CardHeader>
          <CardBody>
            <Stack gap={13}>
              <H2>{selected.title}</H2>
              <Row gap={6} wrap>
                <Pill size="sm">{selected.domain}</Pill>
                <Pill size="sm">{selected.priority}</Pill>
                <Pill size="sm">{selected.category}</Pill>
              </Row>

              <Divider />
              <Stack gap={5}>
                <Text size="small" tone="tertiary" weight="semibold">
                  REQUEST
                </Text>
                <Text>
                  <Code>{selected.request.method}</Code>{" "}
                  <Code>{selected.request.path}</Code>
                </Text>
                <Text size="small">{selected.request.variation}</Text>
              </Stack>

              <Stack gap={5}>
                <Text size="small" tone="tertiary" weight="semibold">
                  AUTHENTICATION
                </Text>
                <Text size="small">
                  Publishable key: {selected.auth.publishableApiKey ? "required" : "not required"}
                </Text>
                <Text size="small">
                  Customer auth: {selected.auth.customerAuthentication ? "required" : "not required"}
                </Text>
              </Stack>

              {selected.preconditions.length > 0 && (
                <Stack gap={5}>
                  <Text size="small" tone="tertiary" weight="semibold">
                    PRECONDITIONS
                  </Text>
                  {selected.preconditions.map((item, index) => (
                    <Text key={index} size="small">
                      {index + 1}. {item}
                    </Text>
                  ))}
                </Stack>
              )}

              <Stack gap={5}>
                <Text size="small" tone="tertiary" weight="semibold">
                  EXPECTED RESULT
                </Text>
                <Text>
                  HTTP <Code>{statusLabel(selected.expected.status)}</Code>
                </Text>
                {selected.expected.assertions.map((item, index) => (
                  <Text key={index} size="small">
                    {index + 1}. {item}
                  </Text>
                ))}
              </Stack>

              <Divider />
              <Button
                variant="secondary"
                onClick={() =>
                  dispatch({
                    type: "openFile",
                    path: selected.file,
                  })
                }
              >
                Open source JSON
              </Button>
            </Stack>
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}

export default App;
`;

await mkdir(canvasDirectory, { recursive: true });
await writeFile(canvasPath, source, "utf8");
console.log(`Generated ${canvasPath} with ${cases.length} cases`);
