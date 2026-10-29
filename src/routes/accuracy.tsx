import { createFileRoute } from "@tanstack/react-router";
import { crops, groupById } from "@/data/crops";

export const Route = createFileRoute("/accuracy")({ component: AccuracyPage });

function AccuracyPage() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8">
      <article className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="font-serif text-3xl">Accuracy</h1>
          <p className="mt-2 text-muted">
            No crop model has been trained or held out. Precision and recall are not measured. Publishing a percentage
            now would be fiction.
          </p>
        </header>
        <section className="grid gap-3 sm:grid-cols-3">
          <Stat label="Validation plots" value="0" />
          <Stat label="Species threshold" value="90%" />
          <Stat label="Crops above the bar" value="0" />
        </section>
        <section className="space-y-2">
          <h2 className="font-serif text-2xl">The rule</h2>
          <p>
            A plot may carry a species name only when a model score is 90% or higher. Below that, the label is the crop
            group, or Uncertain if there is no group. A greenhouse or plastic roof is labeled Greenhouse / covered and
            is never assigned strawberries, peppers, or flowers. With no score at all, the label is Unclassified. That
            is the state of every place in this release.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-serif text-2xl">Why 10 m is not enough</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted">
            <li>Highland vegetables share a short canopy. Cabbage, potato, and carrot do not separate cleanly.</li>
            <li>Cordillera fields are smaller than a Sentinel-2 pixel and are mixed with roads, houses, and pine.</li>
            <li>Clouds hide the rainy season. Radar (Sentinel-1) is not in this release.</li>
            <li>Coffee under trees looks like forest. Cut flowers and strawberries are often under plastic.</li>
            <li>Rice is the class most likely to reach a high score later, and only with labeled fields plus a flood signal. Heirloom versus modern rice will still fail.</li>
          </ul>
          <p>
            What would move a crop over 90%: a few thousand labeled field boundaries in CAR, Sentinel-1 time series,
            and a greenhouse mask. Free 10 m imagery alone will not do it for the vegetable list.
          </p>
        </section>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Crop</th>
                <th className="py-2 pr-3 font-medium">Precision</th>
                <th className="py-2 pr-3 font-medium">Recall</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {crops.map((crop) => (
                <tr key={crop.id} className="border-t border-line">
                  <td className="py-2 pr-3">
                    {crop.name}
                    <span className="block text-xs text-muted">{groupById(crop.groupId)?.name}</span>
                  </td>
                  <td className="py-2 pr-3">Not measured</td>
                  <td className="py-2 pr-3">Not measured</td>
                  <td className="py-2">{crop.separability === "possible-with-labels" ? "Possible later, unproven" : "Unlikely at 10 m"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-cloud px-3 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-mono text-2xl tabular-nums">{value}</p>
    </div>
  );
}
