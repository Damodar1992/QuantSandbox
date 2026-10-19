import React, { useState } from "react";
import { AppBadge } from "@/components/common/AppBadge";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { AppInput } from "@/components/common/AppInput";
import { AppSelect } from "@/components/common/AppSelect";
import { cx, ui } from "@/constants/ui";
import { date } from "./botsDisplay";

const LEVELS = [
  { value: "Off", label: "Off · no external messages" },
  { value: "Critical", label: "Critical · action required" },
  { value: "Important", label: "Important · key bot events" },
  { value: "All", label: "All · routine events too" },
];

function AddTelegramDialog({ bot, owner, model, onClose }) {
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [chatType, setChatType] = useState("private");
  const [chatId, setChatId] = useState("");
  const [error, setError] = useState("");

  const connect = (event) => {
    event.preventDefault();
    const result = model.connectTelegramDestination({
      botId: bot.id, owner, name, token, chatType, chatId,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    setToken("");
    onClose();
  };

  return (
    <AppDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Add Telegram destination"
      description="Connect your own Telegram bot to a private chat or group."
      className="max-w-[580px]"
    >
      <form onSubmit={connect} className="space-y-4 text-[12px]">
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-amber-200">
          UI preview: enter fictional credentials only. The token is discarded when this window closes;
          no Telegram verification or message delivery is performed.
        </p>
        <AppInput
          label="Destination name"
          placeholder="My trading alerts"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
        />
        <AppInput
          label="Telegram bot token · fictional"
          type="password"
          placeholder="Enter a fictional token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          autoComplete="off"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <AppSelect
            label="Chat type"
            value={chatType}
            onValueChange={setChatType}
            options={[
              { value: "private", label: "Private chat" },
              { value: "group", label: "Group" },
            ]}
          />
          <AppInput
            label="Chat ID"
            inputMode="numeric"
            placeholder={chatType === "group" ? "-1001234567890" : "123456789"}
            value={chatId}
            onChange={(event) => setChatId(event.target.value)}
            autoComplete="off"
          />
        </div>
        <p className="text-muted-foreground">
          Add the bot to the selected chat first. A production connection would verify that it can send messages there.
        </p>
        {error ? <p role="alert" className="text-red-400">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <AppButton type="button" onClick={onClose}>Cancel</AppButton>
          <AppButton type="submit" variant="default">Verify and connect · preview</AppButton>
        </div>
      </form>
    </AppDialog>
  );
}

export function BotNotifications({ bot, model, owner }) {
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [feedback, setFeedback] = useState("");
  const canManage = bot.owner === owner;
  const destinations = model.notificationDestinations.filter((item) => item.owner === bot.owner);
  const levels = model.notificationLevels[bot.id] || {};
  const enabled = destinations.filter((item) => levels[item.id] && levels[item.id] !== "Off").length;

  const changeLevel = (destinationId, level) => {
    const error = model.setBotNotificationLevel({ botId: bot.id, destinationId, owner, level });
    setFeedback(error || `Notification level saved: ${level}. Subsequent events use this setting.`);
  };

  const testDestination = (destinationId) => {
    const error = model.sendTestNotification({ botId: bot.id, destinationId, owner });
    setFeedback(error || "Preview test recorded. No Telegram message was sent.");
  };

  const removeDestination = () => {
    const error = model.removeNotificationDestination({ destinationId: removing.id, owner });
    setFeedback(error || `${removing.name} disconnected. Bot event logs are unchanged.`);
    setRemoving(null);
  };

  return (
    <div className="space-y-4 text-[12px]">
      <section className={cx(ui.radius, ui.panel, "p-4")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-semibold text-[#faf7fd]">Notifications via Event Bus</h3>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Bot events stay in the Events log. The notification service routes selected events to
              each enabled destination. Delivery settings can change while this bot runs.
            </p>
          </div>
          <AppBadge status={enabled ? "Enabled" : "Off"} variant={enabled ? "completed" : "muted"}>
            {enabled} enabled
          </AppBadge>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-md border border-[rgba(60,40,80,0.35)] px-2 py-1">Bot events</span>
          <span aria-hidden>→</span>
          <span className="rounded-md border border-[rgba(60,40,80,0.35)] px-2 py-1">Event Bus</span>
          <span aria-hidden>→</span>
          <span className="rounded-md border border-[rgba(60,40,80,0.35)] px-2 py-1">Notification service</span>
          <span aria-hidden>→</span>
          <span className="rounded-md border border-[rgba(60,40,80,0.35)] px-2 py-1">Telegram</span>
        </div>
      </section>

      <section className={cx(ui.radius, ui.panel, "p-4")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[13px] font-medium text-[#faf7fd]">Delivery destinations</h3>
            <p className="mt-1 text-muted-foreground">
              Destinations belong to {bot.owner} and can be reused by their other bots. Each bot has its own level.
            </p>
          </div>
          {canManage ? <AppButton variant="default" onClick={() => { setFeedback(""); setAdding(true); }}>Add Telegram destination</AppButton> : null}
        </div>

        {!canManage ? <p className="mt-4 text-amber-200">Only the bot owner can change these settings.</p> : null}
        {!destinations.length ? (
          <div className="mt-4 rounded-md border border-dashed border-[rgba(100,80,125,0.6)] p-5 text-muted-foreground">
            No destinations connected. Bot events remain available in the Events tab.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {destinations.map((destination) => (
              <div key={destination.id} className="rounded-md border border-[rgba(60,40,80,0.35)] bg-[#120b20] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-[#faf7fd]">{destination.name}</strong>
                      <AppBadge status={destination.status} variant="completed">{destination.status}</AppBadge>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      Telegram · {destination.chatType === "group" ? "Group" : "Private chat"} · Chat ID {destination.chatId}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AppButton disabled={!canManage} onClick={() => testDestination(destination.id)}>
                      Send test notification
                    </AppButton>
                    <AppButton disabled={!canManage} variant="destructive" onClick={() => setRemoving(destination)}>
                      Disconnect
                    </AppButton>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 border-t border-[rgba(60,40,80,0.35)] pt-3 sm:grid-cols-[minmax(230px,360px)_1fr]">
                  <AppSelect
                    label="Notification level for this bot"
                    value={levels[destination.id] || "Off"}
                    onValueChange={(level) => changeLevel(destination.id, level)}
                    options={LEVELS}
                    disabled={!canManage}
                  />
                  <div className="self-end text-[11px] text-muted-foreground">
                    <div>Last simulated test: {destination.lastSuccessAt ? date(destination.lastSuccessAt) : "None"}</div>
                    <div>Latest delivery error: {destination.lastError || "None"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {feedback ? <p role="status" className="mt-3 text-violet-200">{feedback}</p> : null}
      </section>

      <section className={cx(ui.radius, ui.panel, "p-4")}>
        <h3 className="text-[13px] font-medium text-[#faf7fd]">What each level includes</h3>
        <ul className="mt-3 grid gap-2 text-muted-foreground sm:grid-cols-2">
          <li><strong className="text-[#faf7fd]">Critical</strong> · Trading halted, connection loss, failed stop or unknown exposure.</li>
          <li><strong className="text-[#faf7fd]">Important</strong> · Critical plus start and stop outcomes, protection and confirmed trade outcomes.</li>
          <li><strong className="text-[#faf7fd]">All</strong> · Important plus routine trade lifecycle and status events.</li>
          <li><strong className="text-[#faf7fd]">Off</strong> · No external messages; events remain in the bot log.</li>
        </ul>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Preview only: settings live in this browser session. No Event Bus, Telegram API or real delivery is connected.
        </p>
      </section>

      {adding ? <AddTelegramDialog bot={bot} owner={owner} model={model} onClose={() => setAdding(false)} /> : null}
      {removing ? (
        <AppDialog
          open
          onOpenChange={(open) => !open && setRemoving(null)}
          title="Disconnect Telegram destination"
          description={removing.name}
        >
          <div className="space-y-4 text-[12px]">
            <p>
              This destination will be removed from all bots owned by {owner}.
              Bot event history remains available.
            </p>
            <div className="flex justify-end gap-2">
              <AppButton onClick={() => setRemoving(null)}>Cancel</AppButton>
              <AppButton variant="destructive" onClick={removeDestination}>Disconnect</AppButton>
            </div>
          </div>
        </AppDialog>
      ) : null}
    </div>
  );
}
