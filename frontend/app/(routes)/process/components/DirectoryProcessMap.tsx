'use client';

import { DirectorySchema, ProcessSchema } from '@/app/types/schema';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useCallback, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, Edge, MarkerType, MiniMap, Node, NodeTypes, Panel, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node component for directories
const DirectoryNode = ({ data }: { data: any }) => {
  const isParent = !data.parentId;
  const hasSubdirectories = data.hasSubdirectories === true;

  return (
    <div className={`rounded-xl border border-slate-200 p-4 ${isParent ? 'bg-slate-50' : 'bg-white'} w-[220px] shadow-sm`} onClick={data.onClick}>
      <div className='mb-2 flex items-center'>
        <div className={`mr-2 h-3 w-3 rounded-full ${data.color || 'bg-blue-500'}`} />
        <div className='text-sm font-semibold'>{data.name}</div>
        {!isParent && <span className='ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-700'>Sub</span>}
      </div>
      <div className='flex flex-col'>
        <div className='flex justify-between'>
          <div className='text-xs text-slate-500'>{data.processCount} processes</div>
          {data.processCount > 0 && (
            <div className='text-xs'>
              <span className='rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] text-blue-700'>
                {data.templateCount || Math.round(data.processCount * 0.6)} templates
              </span>
            </div>
          )}
        </div>
        {data.description && (
          <div className='mt-1 truncate text-xs text-slate-500' title={data.description}>
            {data.description}
          </div>
        )}

        {/* Add quick actions */}
        <div className='mt-3 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data.onCreateProcess) data.onCreateProcess(data.id);
            }}
            className='rounded bg-blue-50 p-1 text-blue-600 hover:bg-blue-100'
            title='Add process to this directory'
          >
            <PlusIcon className='h-3.5 w-3.5' />
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom node component for processes
const ProcessNode = ({ data }: { data: any }) => {
  const isTemplate = data.isTemplate === true;
  const isInstance = data.isInstance === true;

  let borderClass = 'border-slate-200';
  let bgClass = 'bg-white';
  let extraClasses = '';
  let badge = null;

  if (isTemplate) {
    borderClass = 'border-blue-200';
    bgClass = 'bg-blue-50';
    badge = <span className='ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] text-blue-700'>Template</span>;
  } else if (isInstance) {
    borderClass = 'border-green-200';
    bgClass = 'bg-green-50';
    extraClasses = 'border-dashed';
    badge = <span className='ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] text-green-700'>Instance</span>;
  }

  // Calculate progress for process
  const calculateCompletion = () => {
    if (!data.steps || data.steps.length === 0) return 0;

    let totalItems = data.steps.length;
    let completedItems = data.steps.filter((step) => step.completed).length;

    // Count substeps
    data.steps.forEach((step) => {
      if (step.subSteps && step.subSteps.length > 0) {
        totalItems += step.subSteps.length;
        completedItems += step.subSteps.filter((subStep) => subStep.completed).length;
      }
    });

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const progress = calculateCompletion();

  return (
    <div
      className={`border p-3 ${borderClass} ${extraClasses} rounded-lg ${bgClass} group w-[180px] shadow-sm transition-all hover:border-blue-300 hover:shadow-md`}
      onClick={data.onClick}
    >
      <div className={`absolute top-0 left-0 h-1.5 w-full rounded-t-lg ${data.color || 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}></div>
      <div className='mt-1.5 mb-1 flex flex-wrap items-center'>
        <div className={`mr-2 h-2.5 w-2.5 rounded-full ${data.color || 'bg-indigo-500'}`} />
        <div className='text-xs font-medium'>{data.title}</div>
        {badge}
      </div>
      {data.description && (
        <div className='truncate text-xs text-slate-500' title={data.description}>
          {data.description}
        </div>
      )}

      {data.steps && data.steps.length > 0 && (
        <>
          <div className='mt-2 flex items-center justify-between text-xs'>
            <span className='text-gray-500'>Progress</span>
            <span className='font-medium'>{progress}%</span>
          </div>
          <div className='mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100'>
            <div className='h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all' style={{ width: `${progress}%` }}></div>
          </div>
          <div className='mt-1 text-[10px] text-slate-500'>
            {data.steps.length} {data.steps.length === 1 ? 'step' : 'steps'}
          </div>
        </>
      )}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  directory: DirectoryNode,
  process: ProcessNode,
};

interface DirectoryProcessMapProps {
  directories: DirectorySchema[];
  processes: ProcessSchema[];
  onSelectDirectory: (id: string) => void;
  onSelectProcess: (id: string) => void;
  onCreateProcess?: () => void;
}

export function DirectoryProcessMap({ directories, processes, onSelectDirectory, onSelectProcess, onCreateProcess }: DirectoryProcessMapProps) {
  const [layout, setLayout] = useState<'tree' | 'force'>('tree');
  const [showAllProcesses, setShowAllProcesses] = useState(true);

  // Create nodes and edges from the directories and processes
  const { initialNodes, initialEdges } = useMemo(() => {
    // Log process data to debug
    console.log(`Creating React Flow with ${directories.length} directories and ${processes.length} processes`);
    processes.forEach((p) => {
      console.log(`Process: ${p.title}, directoryId: ${p.directoryId}, isTemplate: ${p.isTemplate}`);
    });

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const directoryPositions: Record = {};
    const processPositions: Record = {};

    // Helper function to organize directories hierarchically
    const buildDirectoryTree = (directories: DirectorySchema[]) => {
      const dirMap = directories.reduce((acc, dir) => {
        acc[dir.id] = { ...dir, children: [] };
        return acc;
      }, {} as Record);

      const rootDirs: any[] = [];

      // Organize into tree structure
      directories.forEach((dir) => {
        if (dir.parentId && dirMap[dir.parentId]) {
          dirMap[dir.parentId].children.push(dirMap[dir.id]);
        } else {
          rootDirs.push(dirMap[dir.id]);
        }
      });

      return rootDirs;
    };

    // Get directory hierarchy
    const directoryTree = buildDirectoryTree(directories);

    // Calculate template counts per directory
    const templateCountsByDir = {};
    const liveCountsByDir = {};
    const processListByDir = {};

    processes.forEach((process) => {
      const directoryId = process.directoryId;
      if (!directoryId) return;

      // Initialize directory's process array if needed
      if (!processListByDir[directoryId]) {
        processListByDir[directoryId] = [];
      }

      // Add process to its directory's list
      processListByDir[directoryId].push(process);

      // Count templates and instances
      if (process.isTemplate) {
        templateCountsByDir[directoryId] = (templateCountsByDir[directoryId] || 0) + 1;
      } else {
        liveCountsByDir[directoryId] = (liveCountsByDir[directoryId] || 0) + 1;
      }
    });

    // Position and add directories in hierarchical structure
    const addDirectoryNodesToGraph = (directoryNodes: any[], level = 0, horizontalIndex = 0, parentId?: string) => {
      const spacing = 350;
      let currentIndex = horizontalIndex;

      directoryNodes.forEach((dir, index) => {
        const x = currentIndex * spacing;
        const y = level * 200;

        directoryPositions[dir.id] = { x, y };

        // Get process list for this directory
        const dirProcesses = processListByDir[dir.id] || [];

        // Add directory node
        nodes.push({
          id: `dir-${dir.id}`,
          type: 'directory',
          position: { x, y },
          data: {
            ...dir,
            processCount: dirProcesses.length,
            templateCount: templateCountsByDir[dir.id] || 0,
            liveCount: liveCountsByDir[dir.id] || 0,
            hasSubdirectories: dir.children && dir.children.length > 0,
            isDirectory: true,
            onClick: () => onSelectDirectory(dir.id),
            onCreateProcess: () => {
              onSelectDirectory(dir.id);
              if (onCreateProcess) onCreateProcess();
            },
          },
        });

        // Add edge from parent to this directory if it exists
        if (parentId) {
          edges.push({
            id: `dir-edge-${parentId}-${dir.id}`,
            source: `dir-${parentId}`,
            target: `dir-${dir.id}`,
            style: { stroke: '#cbd5e1' },
            type: 'step',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
              color: '#cbd5e1',
            },
          });
        }

        // Process children if any
        if (dir.children && dir.children.length > 0) {
          // Calculate width of this subtree
          const childrenWidth = dir.children.length;
          const startPos = currentIndex - childrenWidth / 2 + 0.5;

          // Add children nodes recursively
          addDirectoryNodesToGraph(dir.children, level + 1, startPos, dir.id);

          // Update current position based on children
          currentIndex += childrenWidth;
        } else {
          currentIndex += 1;
        }
      });

      return currentIndex;
    };

    // Add directories to graph
    addDirectoryNodesToGraph(directoryTree);

    // Handle positioning of processes
    const isForceLayout = layout === 'force';

    // Separate template and regular processes
    const templateProcesses = processes.filter((p) => p.isTemplate);
    const regularProcesses = processes.filter((p) => !p.isTemplate);

    // Add template processes below their directories
    templateProcesses.forEach((process, index) => {
      const directoryId = process.directoryId || null;
      if (directoryId && directoryPositions[directoryId]) {
        const dirPos = directoryPositions[directoryId];

        // Calculate position based on index within the directory
        const dirTemplates = templateProcesses.filter((p) => p.directoryId === directoryId);
        const processIndex = dirTemplates.findIndex((p) => p.id === process.id);

        // Position differently based on layout
        let x, y;
        if (isForceLayout) {
          const angle = (Math.PI * 2 * processIndex) / Math.max(dirTemplates.length, 6);
          const radius = 180;
          x = dirPos.x + Math.cos(angle) * radius;
          y = dirPos.y + Math.sin(angle) * radius + 100;
        } else {
          const perRow = 3;
          const offsetX = ((processIndex % perRow) - Math.floor(perRow / 2)) * 200;
          const row = Math.floor(processIndex / perRow);
          x = dirPos.x + offsetX;
          y = dirPos.y + 180 + row * 120;
        }

        processPositions[process.id] = { x, y };

        nodes.push({
          id: `process-${process.id}`,
          type: 'process',
          position: { x, y },
          data: {
            ...process,
            isTemplate: true,
            onClick: () => onSelectProcess(process.id),
          },
        });

        // Add edge from directory to process template
        edges.push({
          id: `edge-${directoryId}-${process.id}`,
          source: `dir-${directoryId}`,
          target: `process-${process.id}`,
          style: { stroke: '#94a3b8' },
          type: 'smoothstep',
        });
      }
    });

    // Only add regular processes if showAllProcesses is true
    if (showAllProcesses) {
      // Add regular processes and connect them to their template processes
      regularProcesses.forEach((process, index) => {
        // Find the template this process is based on
        const templateId = process.templateId || null;

        if (templateId && processPositions[templateId]) {
          // Position below its template
          const templatePos = processPositions[templateId];

          // For force layout, position radially around templates
          // For tree layout, position in rows below templates
          let x, y;

          if (isForceLayout) {
            // Get other instances of this template for positioning
            const siblingInstances = regularProcesses.filter((p) => p.templateId === templateId);
            const instanceIndex = siblingInstances.findIndex((p) => p.id === process.id);
            const angle = (Math.PI * 2 * instanceIndex) / Math.max(siblingInstances.length, 6);
            const radius = 120;

            x = templatePos.x + Math.cos(angle) * radius;
            y = templatePos.y + Math.sin(angle) * radius + 40;
          } else {
            // Tree layout - position below template
            const siblingInstances = regularProcesses.filter((p) => p.templateId === templateId);
            const instanceIndex = siblingInstances.findIndex((p) => p.id === process.id);
            const perRow = 3;
            const offsetX = ((instanceIndex % perRow) - Math.floor(perRow / 2)) * 180;
            const row = Math.floor(instanceIndex / perRow);

            x = templatePos.x + offsetX;
            y = templatePos.y + 120 + row * 100;
          }

          nodes.push({
            id: `process-instance-${process.id}`,
            type: 'process',
            position: { x, y },
            data: {
              ...process,
              isInstance: true,
              onClick: () => onSelectProcess(process.id),
            },
          });

          // Add edge from template to process instance
          edges.push({
            id: `edge-template-${templateId}-instance-${process.id}`,
            source: `process-${templateId}`,
            target: `process-instance-${process.id}`,
            markerEnd: {
              type: MarkerType.Arrow,
            },
            style: { stroke: '#60a5fa' },
            animated: true,
          });
        } else {
          // No template relation, just add it under its directory
          const directoryId = process.directoryId || null;
          if (directoryId && directoryPositions[directoryId]) {
            const dirPos = directoryPositions[directoryId];

            // Calculate position based on index
            const dirProcesses = regularProcesses.filter((p) => p.directoryId === directoryId && !p.templateId);
            const processIndex = dirProcesses.findIndex((p) => p.id === process.id);

            let x, y;
            if (isForceLayout) {
              // Position in circular pattern around directory
              const angle = (Math.PI * 2 * processIndex) / Math.max(dirProcesses.length, 6);
              const radius = 200;
              x = dirPos.x + Math.cos(angle) * radius;
              y = dirPos.y + Math.sin(angle) * radius;
            } else {
              // Position below templates
              const perRow = 2;
              const offsetX = ((processIndex % perRow) - Math.floor(perRow / 2)) * 180;
              const row = Math.floor(processIndex / perRow);

              // Find if there are templates in this directory to position below them
              const templatesInDir = templateProcesses.filter((p) => p.directoryId === directoryId);
              const lastTemplateRow = templatesInDir.length > 0 ? Math.ceil(templatesInDir.length / 3) : 0;

              x = dirPos.x + offsetX + 50; // Offset to differentiate
              y = dirPos.y + 250 + lastTemplateRow * 100 + row * 100;
            }

            nodes.push({
              id: `process-standalone-${process.id}`,
              type: 'process',
              position: { x, y },
              data: {
                ...process,
                onClick: () => onSelectProcess(process.id),
              },
            });

            // Add edge from directory to standalone process
            edges.push({
              id: `edge-${directoryId}-standalone-${process.id}`,
              source: `dir-${directoryId}`,
              target: `process-standalone-${process.id}`,
              style: { stroke: '#cbd5e1' },
              markerEnd: {
                type: MarkerType.Arrow,
                width: 12,
                height: 12,
                color: '#cbd5e1',
              },
            });
          }
        }
      });
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [directories, processes, onSelectDirectory, onSelectProcess, layout, showAllProcesses, onCreateProcess]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node click
  const onNodeClick = useCallback((_, node) => {
    // Handle node click through the data.onClick handlers
  }, []);

  return (
    <div className='flex h-full w-full flex-1 flex-col'>
      <div className='flex-1'>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition='bottom-right'
        >
          <Controls />
          <MiniMap />
          <Background color='#f1f5f9' gap={16} size={1} />
          <Panel position='top-right' className='rounded-md border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur-sm'>
            <div className='flex flex-col gap-1.5'>
              <button
                onClick={() => onCreateProcess && onCreateProcess()}
                className='flex items-center rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs text-white hover:shadow-md'
              >
                <PlusIcon className='mr-1 h-3.5 w-3.5' />
                New Process
              </button>

              <div className='mt-1 border-t border-slate-200 pt-1 text-[10px] text-slate-500'>
                {processes.length} processes | {nodes.length} nodes
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
