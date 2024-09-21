import React, { useEffect, useState } from "react";
import * as d3 from "d3";

const sampleData = {
  projects: [
    {
      id: "project-1",
      name: "First Project",
      clips: ["clip-1", "clip-2", "clip-3", "clip-4", "clip-5", "clip-6"],
    },
    {
      id: "project-2",
      name: "Second Project",
      clips: ["clip-1", "clip-2", "clip-4", "clip-5", "clip-7"],
    },
    {
      id: "project-3",
      name: "Third Project",
      clips: ["clip-2", "clip-3", "clip-5", "clip-6", "clip-8"],
    },
    {
      id: "project-4",
      name: "Fourth Project",
      clips: ["clip-1", "clip-3", "clip-6", "clip-7", "clip-8", "clip-9"],
    },
    {
      id: "project-5",
      name: "Fifth Project",
      clips: ["clip-2", "clip-3", "clip-4", "clip-7", "clip-9", "clip-10"],
    },
  ],
  clips: [
    {
      id: "clip-1",
      name: "Intro Clip",
      usedInProjects: ["project-1", "project-2", "project-4"],
    },
    {
      id: "clip-2",
      name: "Transition Clip",
      usedInProjects: ["project-1", "project-2", "project-3", "project-5"],
    },
    {
      id: "clip-3",
      name: "Main Clip",
      usedInProjects: ["project-1", "project-3", "project-4", "project-5"],
    },
    {
      id: "clip-4",
      name: "Outro Clip",
      usedInProjects: ["project-1", "project-2", "project-5"],
    },
    {
      id: "clip-5",
      name: "B-roll Clip",
      usedInProjects: ["project-1", "project-2", "project-3"],
    },
    {
      id: "clip-6",
      name: "Drone Clip",
      usedInProjects: ["project-1", "project-3", "project-4"],
    },
    {
      id: "clip-7",
      name: "Voiceover Clip",
      usedInProjects: ["project-2", "project-4", "project-5"],
    },
    {
      id: "clip-8",
      name: "Soundtrack Clip",
      usedInProjects: ["project-3", "project-4"],
    },
    {
      id: "clip-9",
      name: "Closing Clip",
      usedInProjects: ["project-4", "project-5"],
    },
    {
      id: "clip-10",
      name: "Behind the Scenes Clip",
      usedInProjects: ["project-5"],
    },
  ],
};

const Zettelkasten = () => {
  const [projects, setProjects] = useState([]);
  const [clips, setClips] = useState([]);
  const [isDisappeared, setIsDisappeared] = useState(false);
  const [svgInitialized, setSvgInitialized] = useState(false);
  const [simulation, setSimulation] = useState(null);

  useEffect(() => {
    setProjects(sampleData.projects);
    setClips(sampleData.clips);
  }, []);

  const initializeGraph = () => {
    const width = 1000;
    const height = 800;

    const svg = d3
      .select("#network")
      .attr("width", width)
      .attr("height", height)
      .style("background-color", "#000");

    svg.selectAll("*").remove();

    const nodes = [...projects, ...clips];
    const links = [];

    projects.forEach((project) => {
      project.clips.forEach((clipId) => {
        links.push({
          source: project.id,
          target: clipId,
        });
      });
    });

    const newSimulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(150)
      )
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .alphaTarget(0.3)
      .alphaDecay(0.05);
    const clipColor = "#808080";
    const projectColor = "#B7AA98";
    const highlightColor = "#EB5939";

    const node = svg
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 10)
      .attr("fill", (d) => {
        if (d.clips) {
          return projectColor;
        }
        const clip = clips.find((clip) => clip.id === d.id);
        if (clip && clip.usedInProjects.length > 2) {
          return highlightColor;
        }
        return clipColor;
      })
      .call(
        d3
          .drag()
          .on("start", dragStarted)
          .on("drag", dragged)
          .on("end", dragEnded)
      );

    const link = svg
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .enter()
      .append("line");

    const label = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("dy", 3)
      .attr("x", 12)
      .attr("fill", "#fff")
      .text((d) => d.name);

    newSimulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      label.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    setSimulation(newSimulation);
    setSvgInitialized(true);
  };

  function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  const animateNodesDisappear = () => {
    const svg = d3.select("#network");
    if (!svgInitialized) return;

    const nodes = svg.selectAll("circle");
    const links = svg.selectAll("line");
    const labels = svg.selectAll("text");

    nodes.each(function (d, i) {
      d3.select(this)
        .transition()
        .delay(i * 100)
        .duration(500)
        .attr("r", 0)
        .style("opacity", 0)
        .remove();
    });

    links.each(function (d, i) {
      d3.select(this)
        .transition()
        .delay(i * 100)
        .duration(500)
        .style("opacity", 0)
        .remove();
    });

    labels.each(function (d, i) {
      d3.select(this)
        .transition()
        .delay(i * 100)
        .duration(500)
        .style("opacity", 0)
        .remove();
    });

    setIsDisappeared(true);
  };

  const animateNodesReappear = () => {
    const width = 1000;
    const height = 800;
    const svg = d3.select("#network");

    const nodes = [...projects, ...clips];
    const links = [];

    projects.forEach((project) => {
      project.clips.forEach((clipId) => {
        links.push({
          source: project.id,
          target: clipId,
        });
      });
    });

    simulation.nodes(nodes).alpha(1).restart();

    const link = svg
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .style("opacity", 0)
      .transition()
      .delay((d, i) => i * 200)
      .duration(500)
      .style("opacity", 1);

    simulation.force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(150)
    );

    const node = svg
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 0)
      .attr("fill", (d) => {
        if (d.clips) {
          return "#B7AA98";
        }
        const clip = clips.find((clip) => clip.id === d.id);
        if (clip && clip.usedInProjects.length > 2) {
          return "#EB5939";
        }
        return "#808080";
      })
      .style("opacity", 0)
      .transition()
      .delay((d, i) => i * 200)
      .duration(500)
      .attr("r", 10)
      .style("opacity", 1)
      .on("end", function () {
        d3.select(this).call(
          d3
            .drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded)
        );
      });

    const label = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("dy", 3)
      .attr("x", 12)
      .attr("fill", "#fff")
      .text((d) => d.name)
      .style("opacity", 0)
      .transition()
      .delay((d, i) => i * 100)
      .duration(500)
      .style("opacity", 1);

    simulation.on("tick", () => {
      svg
        .selectAll("line")
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      svg
        .selectAll("circle")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);

      svg
        .selectAll("text")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y);
    });

    setIsDisappeared(false);
  };

  useEffect(() => {
    initializeGraph();
  }, [projects, clips]);

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-black">
      <h1 className="text-white text-3xl mb-6">
        Zettelkasten for Video Editing
      </h1>
      <button
        onClick={isDisappeared ? animateNodesReappear : animateNodesDisappear}
        className="mb-4 px-6 py-3 bg-gradient-to-r from-purple-400 to-blue-500 text-white rounded-lg shadow-lg hover:from-purple-500 hover:to-blue-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transition duration-300 ease-in-out"
      >
        {isDisappeared ? "Reappear Nodes" : "Disappear Nodes"}
      </button>
      <svg id="network" className="rounded-lg border border-gray-500"></svg>
    </div>
  );
};

export default Zettelkasten;
