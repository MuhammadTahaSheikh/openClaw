import type { Lead } from "../api/leads";

export function LeadCard({ lead }: { lead: Lead }) {
  return (
    <article className="lead-card">
      <div className="lead-top">
        <h4>
          <a href={lead.url} target="_blank" rel="noreferrer">
            {lead.title}
          </a>
        </h4>
        {lead.employmentType && <span className="badge">{lead.employmentType}</span>}
      </div>

      <div className="lead-meta">
        {lead.salary && <span>{lead.salary}</span>}
        {lead.postedAt && <span>{lead.postedAt}</span>}
      </div>

      {lead.description && (
        <p className="lead-desc">
          {lead.description.length > 220
            ? `${lead.description.slice(0, 220)}…`
            : lead.description}
        </p>
      )}

      {lead.skills.length > 0 && (
        <div className="skills">
          {lead.skills.map((skill) => (
            <span key={skill} className="skill">
              {skill}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
