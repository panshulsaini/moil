"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MOCK_SENSOR_NODES, MineTelemetryNode } from "@/lib/mock-telemetry";
import { Radio, Battery, Wifi, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export function SensorHealthTable() {
  const [nodes] = React.useState<MineTelemetryNode[]>(MOCK_SENSOR_NODES);

  return (
    <Card className="border-slate-800/80 bg-[#0C1220]/90">
      <CardHeader className="p-4 pb-3 border-b border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-cyan-400" />
          <CardTitle className="text-sm font-semibold text-white">
            In-Situ Geotechnical & Weather Sensor Telemetry Nodes
          </CardTitle>
        </div>
        <Badge variant="outline" className="font-mono text-xs text-slate-300">
          8/8 Nodes Online
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Node ID & Site</TableHead>
              <TableHead>Sensor Type</TableHead>
              <TableHead>Physical Location</TableHead>
              <TableHead>Telemetry Reading</TableHead>
              <TableHead>Battery / Signal</TableHead>
              <TableHead>Health Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nodes.map((node) => {
              const isNormal = node.status === "NORMAL";
              const isWarning = node.status === "WARNING";
              const isCritical = node.status === "CRITICAL";

              return (
                <TableRow key={node.id}>
                  <TableCell>
                    <div className="font-bold text-white font-mono">{node.id}</div>
                    <div className="text-[10px] text-slate-400">{node.mine_name}</div>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                      {node.sensor_type}
                    </span>
                  </TableCell>

                  <TableCell className="text-slate-300">{node.location}</TableCell>

                  <TableCell>
                    <span className="font-mono font-bold text-white text-xs">
                      {node.reading} {node.unit}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <Battery className="h-3 w-3 text-emerald-400" /> {node.battery_pct}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Wifi className="h-3 w-3 text-cyan-400" /> {node.signal_rssi} dBm
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        isCritical
                          ? "critical"
                          : isWarning
                          ? "warning"
                          : "success"
                      }
                      className="gap-1 font-mono text-[10px]"
                    >
                      {isCritical ? (
                        <AlertTriangle className="h-2.5 w-2.5" />
                      ) : isWarning ? (
                        <AlertTriangle className="h-2.5 w-2.5" />
                      ) : (
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      )}
                      {node.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
